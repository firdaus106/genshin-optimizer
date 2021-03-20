import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  ProgressBar,
  Row,
} from "react-bootstrap";
import ReactGA from "react-ga";
import scan_art_main from "./imgs/scan_art_main.png";
import Snippet from "./imgs/snippet.png";
import Stat from "../Stat";
import { clamp } from "../Util/Util";
import Artifact from "./Artifact";
import ArtifactOCR from "./ArtifactOCR";

const artifactOCR = new ArtifactOCR();
const numItemsToDetect = Object.keys(artifactOCR.itemsToDetect).length;
let detectedItems = 0;

export default function UploadDisplay(props) {
  let { setState, reset } = props;
  const [fileName, setFileName] = useState(
    "Click here to Upload Artifact Screenshot File"
  );
  const [image, setImage] = useState("");

  const [scanning, setScanning] = useState(false);
  const [starText, setStarText] = useState("");
  const [slotText, setSlotText] = useState("");
  const [subStatText, setSubStatText] = useState("");
  const [artScanProgress, setScanProgress] = useState(0);
  const [artSetProgVariant, setScanProgressVariant] = useState("");
  const [artSetText, setArtSetText] = useState("");
  const [mainStatValText, setMainStatValText] = useState("");
  const [mainStatText, setMainStatText] = useState("");
  const [levelText, setLevelText] = useState("");

  const [modalShow, setModalShow] = useState(false);
  const resetText = () => {
    setStarText("");
    setArtSetText("");
    setSlotText("");
    setSubStatText("");
    setMainStatValText("");
    setMainStatText("");
    setLevelText("");
  };
  const resetState = () => {
    setFileName("Click here to Upload Artifact Screenshot File");
    setImage("");
    setModalShow(false);
    setScanning(false);

    setScanProgress(0);
    setScanProgressVariant("");
    resetText();
  };

  const updateProgressBar = (progress) => {
    if (progress === 1) {
      detectedItems++;
    }
    setScanProgress(detectedItems / numItemsToDetect);
  };

  const guessLevel = (nStars, mainSKey, mainSVal) => {
    const mainStatValues = Artifact.getMainStatValues(
      nStars,
      mainSKey.includes("_dmg_") ? "ele_dmg_" : mainSKey
    );

    if (mainStatValues.length > 0) {
      const isFloat = Stat.getStatUnit(mainSKey) === "%";
      const testLevel = mainStatValues.findIndex((val) =>
        isFloat ? Math.abs(mainSVal - val) < 0.1 : mainSVal === val
      );

      if (testLevel !== -1) {
        return {
          isValid: true,
          value: testLevel,
        };
      }
    }

    return {
      isValid: false,
      value: -1,
    };
  };

  const uploadedFile = async (file) => {
    if (!file) return;

    setScanning(true);
    resetText();
    detectedItems = 0;
    setFileName(file.name);

    const urlFile = await fileToURL(file);
    const imageDataObj = await urlToImageData(urlFile);

    await artifactOCR.setImage(imageDataObj);
    setImage(await artifactOCR.getDisplayImage());

    await artifactOCR.initWorkers("eng", 2, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setScanProgressVariant("success");
          updateProgressBar(m.progress);
        } else if (m.status === "loading tesseract core") {
          setScanProgressVariant("danger");
        } else if (m.status.includes("loading language traineddata")) {
          setScanProgressVariant("warning");
        } else if (m.status.includes("initializing api")) {
          setScanProgressVariant("info");
        } else if (
          ![
            "initializing tesseract",
            "initialized tesseract",
            "loaded language traineddata",
            "initialized api",
          ].includes(m.status)
        ) {
          console.error(m);
        }
      },
      errorHandler: (err) => console.error(err),
    });

    let numStars = artifactOCR.getStars(),
      numStarsText = "";

    const ret = await artifactOCR.scan();

    if (ret.MainStatValue.isValid) {
      setMainStatValText(
        <span>
          Detected Main Stat Value:{" "}
          <span className="text-success">
            {ret.MainStatValue.value}
            {ret.MainStatValue.unit}
          </span>
        </span>
      );
    } else {
      setMainStatValText(
        <span className="text-warning">Could not detect main stat value.</span>
      );
    }

    if (ret.Set.isValid && numStars) {
      if (!Artifact.getRarityArr(ret.Set.value).includes(numStars)) {
        numStars = 0;
        numStarsText = (
          <span className="text-danger">Could not detect artifact rarity.</span>
        );
      }
    }

    if (!ret.MainStat.isValid) {
      let stats = Artifact.getSlotMainStatKeys(ret.Slot.value);

      if (stats.length === 1) {
        ret.MainStat.isValid = true;
        ret.MainStat.value = stats[0];
        setMainStatText(
          <span className="text-warning">
            Main stat was not successfully detected. Since artifact is of "
            {Artifact.getSlotName(ret.Slot.value)}", main stat:{" "}
            <span className="text-danger">
              {Stat.getStatName(ret.MainStat.value)}
            </span>
          </span>
        );
      } else {
        stats = stats.filter((stat) => {
          if (ret.MainStatValue.isValid) {
            if (ret.MainStatValue.unit !== Stat.getStatUnit(stat)) {
              return false;
            } else if (
              numStars &&
              ret.Level.isValid &&
              Artifact.getMainStatValue(stat, numStars, ret.Level.value) !==
                ret.MainStatValue.value
            ) {
              return false;
            }
          }

          if (
            [1, 2, 3, 4].some(
              (i) =>
                ret["SubStat_" + i].isValid && ret["SubStat_" + i].key === stat
            )
          ) {
            return false;
          }

          return true;
        });

        if (stats.length > 0) {
          ret.MainStat.isValid = true;
          ret.MainStat.value = stats[0];
          setMainStatText(
            <span className="text-warning">
              Main stat was not successfully detected. Inferring main stat:{" "}
              <span className="text-danger">
                {Stat.getStatName(ret.MainStat.value)}
              </span>
              .
            </span>
          );
        }
      }
    }

    if (
      !ret.Level.isValid &&
      ret.MainStat.isValid &&
      ret.MainStatValue.isValid
    ) {
      if (numStars) {
        const { isValid, value } = guessLevel(
          numStars,
          ret.MainStat.value,
          ret.MainStatValue.value
        );
        if (isValid) {
          ret.Level.isValid = isValid;
          ret.Level.value = value;

          setLevelText(
            <span>
              Detected level: <span className="text-success">{value}</span>
            </span>
          );
        }
      }

      if (!ret.Level.isValid) {
        let stars = ret.Set.isValid
          ? Artifact.getRarityArr(ret.Set.value)
          : Artifact.getStars().reverse(); //reverse so we check 5* first

        for (const nStar of stars) {
          const { isValid, value } = guessLevel(
            nStar,
            ret.MainStat.value,
            ret.MainStatValue.value
          );

          if (
            isValid &&
            (!ret.Set.isValid ||
              Artifact.getRarityArr(ret.Set.value).includes(nStar))
          ) {
            ret.Level.isValid = isValid;
            ret.Level.value = value;
            setLevelText(
              <span className="text-warning">
                Inferred level: <span className="text-danger">{value}</span>
              </span>
            );

            numStars = nStar;
            numStarsText = (
              <span className="text-warning">
                Inferred <span className="text-success">{numStars}</span> Stars
                from Artifact Set.
              </span>
            );
            break;
          }
        }
      }

      // check level validity against numStars
      if (!ret.Level.isValid && numStars) {
        if (ret.Level.value > numStars * 4) {
          ret.Level.isValid = false;
          ret.Level.value = NaN;
        }
      }
    }

    //check if the final star values are valid
    numStars = clamp(numStars, 3, 5);

    // if the level is not parsed at all after all the previous steps,
    // default it to the highest level of the star value
    if (!ret.Level.isValid) {
      ret.Level.isValid = true;
      ret.Level.value = numStars * 4;

      setLevelText(
        <span className="text-warning">
          Could not detect artifact level. Default to:{" "}
          <span className="text-danger">{ret.Level.value}</span>
        </span>
      );
    }

    // try to infer slotKey if could not be detected
    if (!ret.Slot.isValid && ret.MainStat.isValid) {
      // infer slot name from main stat
      const slotKeys = Artifact.getSlotKeys();

      for (const key of slotKeys) {
        if (Artifact.getSlotMainStatKeys(key).includes(ret.MainStat.value)) {
          ret.Slot.isValid = true;
          ret.Slot.value = key;

          setSlotText(
            <span className="text-warning">
              Slot name was not successfully detected. Inferring slot name:{" "}
              <span className="text-danger">
                {Artifact.getSlotName(ret.Slot.value)}
              </span>
              .
            </span>
          );
          break;
        }
      }
    }

    let state = {};
    if (ret.Level.isValid) {
      state.level = ret.Level.value;
      setLevelText(
        <span>
          Detected level:{" "}
          <span className="text-success">{ret.Level.value}</span>
        </span>
      );
    }

    if (ret.Set.isValid) {
      state.setKey = ret.Set.value;
      setArtSetText(
        <span>
          Detected Set:{" "}
          <span className="text-success">
            {Artifact.getSetName(ret.Set.value)}
          </span>
        </span>
      );
    } else {
      setArtSetText(
        <span className="text-danger">Could not detect artifact set name.</span>
      );
    }

    if (ret.Slot.isValid) {
      state.slotKey = ret.Slot.value;
      setSlotText(
        <span>
          Detected Slot Name:{" "}
          <span className="text-success">
            {Artifact.getSlotName(ret.Slot.value)}
          </span>
        </span>
      );
    } else {
      setSlotText(
        <span className="text-danger">Could not detect slot name.</span>
      );
    }

    if ([1, 2, 3, 4].some((i) => ret["SubStat_" + i].isValid)) {
      state.substats = [1, 2, 3, 4].map((i) => {
        return {
          key: ret["SubStat_" + i].key,
          value: ret["SubStat_" + i].value,
        };
      });

      const len = state.substats.reduce(
        (accu, substat) => accu + (substat.key ? 1 : 0),
        0
      );
      const low = Artifact.getBaseSubRollNumLow(numStars);

      if (numStars && len < low) {
        setSubStatText(
          <span className="text-warning">
            Detected {len} substats, but there should be at least {low}{" "}
            substats.
          </span>
        );
      } else {
        setSubStatText(
          <span>
            Detected <span className="text-success">{len}</span> substats.
          </span>
        );
      }
    } else {
      setSubStatText(
        <span className="text-danger">Could not detect any substats.</span>
      );
    }

    if (numStars) {
      state.numStars = numStars;
      setStarText(numStarsText);
    }

    if (ret.MainStat.isValid) {
      state.mainStatKey = ret.MainStat.value;
      setMainStatText(
        <span>
          Detected Main Stat:{" "}
          <span className="text-success">
            {Stat.getStatNameRaw(ret.MainStat.value)}
          </span>
        </span>
      );
    } else {
      setMainStatText(
        <span className="text-danger">Could not detect main stat.</span>
      );
    }

    setState?.(state);
  };

  useEffect(() => {
    let pasteFunc = (e) => uploadedFile(e.clipboardData.files[0]);
    window.addEventListener("paste", pasteFunc);
    reset?.(resetState);
    return () => window.removeEventListener("paste", pasteFunc);
  });
  let img = Boolean(image) && (
    <img
      src={image}
      className="w-100 h-auto"
      alt="Screenshot to parse for artifact values"
    />
  );
  let artScanProgressPercent = (artScanProgress * 100).toFixed(1);
  return (
    <Row>
      <ExplainationModal {...{ modalShow, setModalShow }} />
      <Col xs={12} className="mb-2">
        <Row>
          <Col>
            <h6 className="mb-0">Parse Substats by Uploading Image</h6>
          </Col>
          <Col xs="auto">
            <Button
              variant="info"
              size="sm"
              onClick={() => {
                setModalShow(true);
                ReactGA.modalview("/artifact/how-to-upload");
              }}
            >
              Show Me How!
            </Button>
          </Col>
        </Row>
      </Col>
      <Col xs={8} lg={image ? 4 : 0}>
        {img}
      </Col>
      <Col xs={12} lg={image ? 8 : 12}>
        <Form.File
          type="file"
          className="mb-0"
          id="inputGroupFile01"
          label={fileName}
          onChange={(e) => {
            uploadedFile(e.target.files[0]);
          }}
          custom={true}
        />
        {Boolean(!image) && (
          <Form.Label className="mb-0">
            Please Select an Image, or paste a screenshot here (Ctrl+V)
          </Form.Label>
        )}

        {scanning && (
          <>
            <div className="mt-2 mb-2">
              <h6 className="mb-0">{`Scan${
                artScanProgressPercent < 100 ? "ning" : "ned"
              } Artifact`}</h6>
              <ProgressBar
                variant={artSetProgVariant}
                now={artScanProgressPercent}
                label={`${artScanProgressPercent}%`}
              />
            </div>
            <div className="mb-2">
              <div>{starText}</div>
              <div>{artSetText}</div>
              <div>{slotText}</div>
              <div>{mainStatValText}</div>
              <div>{mainStatText}</div>
              <div>{levelText}</div>
              <div>{subStatText}</div>
            </div>
          </>
        )}
      </Col>
    </Row>
  );
}
function ExplainationModal({ modalShow, setModalShow }) {
  return (
    <Modal
      show={modalShow}
      onHide={() => setModalShow(false)}
      size="xl"
      variant="success"
      contentClassName="bg-transparent"
    >
      <Card bg="darkcontent" text="lightfont">
        <Card.Header>
          <Row>
            <Col>
              <Card.Title>How do Upload Screenshots for parsing</Card.Title>
            </Col>
            <Col xs="auto">
              <Button variant="danger" onClick={() => setModalShow(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={8} md={4}>
              <img
                alt="snippet of the screen to take"
                src={Snippet}
                className="w-100 h-auto"
              />
            </Col>
            <Col xs={12} md={8}>
              <p>
                Using screenshots can dramatically decrease the amount of time
                you manually input in stats on the Genshin Optimizer.
              </p>
              <h5>Where to snip the screenshot.</h5>
              <p>
                In game, Open your bag, and navigate to the artifacts tab.
                Select the artifact you want to scan with Genshin Optimizer. To
                take a screenshot, in Windows, the shortcut is{" "}
                <strong>Shift + WindowsKey + S</strong>. Once you selected the
                region, the image is automatically included in your clipboard.
              </p>
              <h5>What to include in the screenshot.</h5>
              <p>
                As shown in the Image, starting from the top with the artifact
                name, all the way to the set name(the text in green).{" "}
              </p>
            </Col>
          </Row>
          <Row>
            <Col>
              <h5>Adding Screenshot to Genshin Optimizer</h5>
              <p>
                At this point, you should have the artifact snippet either saved
                to your harddrive, or in your clipboard. You can click on the
                box next to "Browse" to browse the file in your harddrive, or
                even easier, just press <strong>Ctrl + V</strong> to paste from
                your clipboard. You should be able to see a Preview of your
                artifact snippet, and after waiting a few seconds, the artifact
                set and the substats will be filled in in the{" "}
                <b>Artifact Editor</b>.
              </p>
            </Col>
            <Col xs={12}>
              <h5>Finishing the Artifact</h5>
              <p>
                Unfortunately, computer vision is not 100%. There will always be
                cases where something is not scanned properly. You should always
                double check the scanned artifact values! Once the artifact has
                been filled, Click on <strong>Add Artifact</strong> to finish
                editing the artifact.
              </p>
              <img
                alt="main screen after importing stats"
                src={scan_art_main}
                className="w-75 h-auto"
              />
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer>
          <Button variant="danger" onClick={() => setModalShow(false)}>
            <span>Close</span>
          </Button>
        </Card.Footer>
      </Card>
    </Modal>
  );
}

let reader = new FileReader();
function fileToURL(file) {
  return new Promise((resolve) => {
    // let reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
function urlToImageData(urlFile) {
  return new Promise((resolve) => {
    let img = new Image();
    img.onload = () => resolve(getImageData(img));
    img.src = urlFile;
  });
}

function getImageData(image) {
  const tempCanvas = document.createElement("canvas"),
    tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  tempCtx.drawImage(image, 0, 0, image.width, image.height);
  const imageDataObj = tempCtx.getImageData(0, 0, image.width, image.height);
  return imageDataObj;
}

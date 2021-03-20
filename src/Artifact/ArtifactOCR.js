import Jimp from "jimp";
import { createWorker, createScheduler } from "tesseract.js";
import Artifact from "./Artifact";
import Character from "../Character/Character";
import Stat from "../Stat";
import { hammingDistance } from "../Util/Util";

export default class ArtifactOCR {
  STAR_COLOR = { r: 255, g: 204, b: 50, a: 255 }; // #FFCC32

  baseImage;
  details = {
    stars: -1,
  };
  isWorkerInitialized;
  multiplier = { height: 1, width: 1 };
  scheduler;
  workers;

  subStatProcesses = (subNum) => [
    {
      action: "crop",
      defaultOptions: [
        Math.floor(1343 * this.multiplier.width),
        Math.floor((482 + (subNum - 1) * 39) * this.multiplier.height),
        Math.ceil((1641 - 1343) * this.multiplier.width),
        Math.ceil(29 * this.multiplier.height),
      ],
    },
    {
      action: "scale",
      defaultOptions: [3.2],
    },
    {
      action: "threshold",
      defaultOptions: [{ max: 175 }],
    },
    {
      action: "normalize",
    },
  ];

  subStatValidate = ({ data }) => {
    const text = data.text.replace(/\n|,/g, "");

    for (const key of Artifact.getSubStatKeys()) {
      let regex = null;
      let unit = Stat.getStatUnit(key);
      let name = Stat.getStatNameRaw(key);

      regex = new RegExp(name + "\\s*\\+\\s*(\\d+,\\d+|\\d+)($|\\s)", "im");
      if (unit === "%") {
        regex = new RegExp(name + "\\s*\\+\\s*(\\d+\\.\\d)%", "im");
      }

      let match = regex.exec(text);
      if (match) {
        return {
          confidence: data.confidence,
          isValid: true,
          value: unit === "%" ? parseFloat(match[1]) : parseInt(match[1]),
          unit,
          key,
        };
      }
    }

    return {
      confidence: data.confidence,
      isValid: false,
      key: "",
      value: 0,
    };
  };

  itemsToDetect = {
    Slot: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1319 * this.multiplier.width),
            Math.floor(191 * this.multiplier.height),
            Math.ceil((1537 - 1319) * this.multiplier.width),
            Math.ceil((218 - 191) * this.multiplier.height),
          ],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 188 }],
        },
        {
          action: "normalize",
        },
        {
          action: "invert",
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\n/g, "");
        const value = Artifact.getSlotKeys().find(
          (key) => Artifact.getSlotName(key) === text
        );

        return {
          confidence: data.confidence,
          isValid: value ? true : false,
          value,
        };
      },
    },
    MainStat: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1320 * this.multiplier.width),
            Math.floor(274 * this.multiplier.height),
            Math.ceil((1541 - 1320) * this.multiplier.width),
            Math.ceil((302 - 274) * this.multiplier.height),
          ],
        },
        {
          action: "scale",
          defaultOptions: [2],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 150 }],
        },
        {
          action: "normalize",
        },
        {
          action: "invert",
        },
        {
          action: "autocrop",
          defaultOptions: [0.05],
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\n/g, "").toLowerCase();
        const value = Artifact.getMainStatKeys().find((key) =>
          text.includes(Stat.getStatNameRaw(key).toLowerCase())
        );

        return {
          confidence: data.confidence,
          isValid: value ? true : false,
          value,
        };
      },
    },
    MainStatValue: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1320 * this.multiplier.width),
            Math.floor(302 * this.multiplier.height),
            Math.ceil((1470 - 1320) * this.multiplier.width),
            Math.ceil((347 - 302) * this.multiplier.height),
          ],
        },
        {
          action: "scale",
          defaultOptions: [2],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 175 }],
        },
        {
          action: "invert",
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\n/g, "");
        let regex = /(\d+\.\d)%/;
        let match = regex.exec(text);
        if (match) {
          return {
            confidence: data.confidence,
            isValid: true,
            unit: "%",
            value: parseFloat(match[1]),
          };
        }
        regex = /(\d+,\d{3}|\d{2,3})/;
        match = regex.exec(text);
        if (match) {
          return {
            confidence: data.confidence,
            isValid: true,
            unit: "",
            value: parseInt(match[1].replace(/,/g, "")),
          };
        }
      },
    },
    Level: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1322 * this.multiplier.width),
            Math.floor(430 * this.multiplier.height),
            Math.ceil((1377 - 1322) * this.multiplier.width),
            Math.ceil((456 - 430) * this.multiplier.height),
          ],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 175 }],
        },
        {
          action: "normalize",
        },
        {
          action: "invert",
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\+|\n/g, "");
        const level = parseInt(text);

        return {
          confidence: data.confidence,
          isValid: level >= 0 && level <= 20,
          value: level,
        };
      },
    },
    SubStat_1: {
      processes: this.subStatProcesses(1),
      validateValue: this.subStatValidate,
    },
    SubStat_2: {
      processes: this.subStatProcesses(2),
      validateValue: this.subStatValidate,
    },
    SubStat_3: {
      processes: this.subStatProcesses(3),
      validateValue: this.subStatValidate,
    },
    SubStat_4: {
      processes: this.subStatProcesses(4),
      validateValue: this.subStatValidate,
    },
    Equipped: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1370 * this.multiplier.width),
            Math.floor(915 * this.multiplier.height),
            Math.ceil((1680 - 1370) * this.multiplier.width),
            Math.ceil((950 - 915) * this.multiplier.height),
          ],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 175 }],
        },
        {
          action: "normalize",
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\n/g, "");
        const splitText = text.split(": ");
        let charData;
        if (splitText && splitText.length > 0) {
          const characterName = splitText[1];
          charData = Character.getAllCharacterKeys().find((key) => {
            const currentCharData = Character.getCDataObj(key);
            if (currentCharData.name === characterName) {
              return currentCharData;
            }
            return false;
          });
        }
        return {
          confidence: data.confidence,
          isValid: charData ? true : false,
          value: charData,
        };
      },
    },
    Set: {
      processes: [
        {
          action: "crop",
          defaultOptions: [
            Math.floor(1317 * this.multiplier.width),
            Math.floor(635 * this.multiplier.height),
            Math.ceil((1630 - 1317) * this.multiplier.width),
            Math.ceil((670 - 635) * this.multiplier.height),
          ],
        },
        {
          action: "scale",
          defaultOptions: [5],
        },
        {
          action: "threshold",
          defaultOptions: [{ max: 200 }],
        },
        {
          action: "normalize",
        },
        {
          action: "autocrop",
          defaultOptions: [0.005],
        },
      ],
      validateValue: ({ data }) => {
        const text = data.text.replace(/\n/g, "");
        for (const key of Artifact.getSetKeys()) {
          if (
            hammingDistance(
              text.replace(/\W/g, ""),
              Artifact.getSetName(key).replace(/\W/g, "")
            ) <= 2
          ) {
            return {
              confidence: data.confidence,
              isValid: true,
              value: key,
            };
          }
        }
        return {
          confidence: data.confidence,
          isValid: false,
        };
      },
    },
  };

  constructor() {
    this.scheduler = createScheduler();
    this.isWorkerInitialized = false;
    this.workers = [];
  }

  async initWorkers(lang = "eng", numWorkers = 2, workerOptions = {}) {
    if (this.isWorkerInitialized) {
      return;
    }

    for (let i = 0; i < numWorkers; i++) {
      this.workers.push(createWorker(workerOptions));
    }

    this.workers.forEach((w) => this.scheduler.addWorker(w));
    await Promise.all(this.workers.map((w) => w.load()));
    await Promise.all(this.workers.map((w) => w.loadLanguage(lang)));
    await Promise.all(this.workers.map((w) => w.initialize(lang)));
    this.isWorkerInitialized = true;
  }

  async setImage(image) {
    this.baseImage = await Jimp.read(image);
    this.multiplier.height = this.baseImage.bitmap.height / 1080;
    this.multiplier.width = this.baseImage.bitmap.width / 1920;
  }

  async getDisplayImage() {
    return await this.baseImage
      .clone()
      .crop(
        Math.floor(1293 * this.multiplier.width),
        Math.floor(120 * this.multiplier.height),
        Math.ceil((1783 - 1293) * this.multiplier.width),
        Math.ceil((960 - 120) * this.multiplier.height)
      )
      .getBase64Async(Jimp.MIME_PNG);
  }

  getStars(tolerance = 15) {
    this.details.stars = [1334, 1368, 1401, 1435, 1469].filter((x) => {
      const color = Jimp.intToRGBA(
        this.baseImage.getPixelColor(
          Math.ceil(x * this.multiplier.width),
          Math.ceil(373 * this.multiplier.height)
        )
      );
      return (
        color.r > this.STAR_COLOR.r - tolerance &&
        color.r < this.STAR_COLOR.r + tolerance &&
        color.g > this.STAR_COLOR.g - tolerance &&
        color.g < this.STAR_COLOR.g + tolerance &&
        color.b > this.STAR_COLOR.b - tolerance &&
        color.b < this.STAR_COLOR.b + tolerance &&
        color.a > this.STAR_COLOR.a - tolerance &&
        color.a < this.STAR_COLOR.a + tolerance
      );
    }).length;
    return this.details.stars;
  }

  async scan() {
    // Scan the artifact except for set as we need to determine first how many
    // sub stats do we have
    const keys = Object.keys(this.itemsToDetect).filter((key) => key !== "Set"),
      promises = [],
      scannedResult = {};
    let numSubStats = 0;

    keys.forEach((key) => {
      const tmpImage = this.baseImage.clone();

      this.itemsToDetect[key].processes.forEach(
        ({ action, defaultOptions = [] }) => {
          const options = [...defaultOptions];

          if (action === "crop") {
            options[0] = Math.floor(options[0] * this.multiplier.width);
            options[1] = Math.floor(options[1] * this.multiplier.height);
            options[2] = Math.ceil(options[2] * this.multiplier.width);
            options[3] = Math.ceil(options[3] * this.multiplier.height);
          }

          tmpImage[action](...options);
        }
      );

      promises.push(
        tmpImage
          .getBufferAsync(Jimp.MIME_PNG)
          .then((img) => this.scheduler.addJob("recognize", img))
      );
    });

    (await Promise.all(promises)).forEach((ret, idx) => {
      const key = keys[idx];

      scannedResult[key] = { ...this.itemsToDetect[key].validateValue(ret) };

      if (key.includes("SubStat") && scannedResult[key].isValid) {
        numSubStats++;
      }
    });

    // Scan Artifact Set
    const tmpImage = this.baseImage.clone();
    this.itemsToDetect.Set.processes.forEach(
      ({ action, defaultOptions = [] }) => {
        const options = [...defaultOptions];

        if (action === "crop") {
          options[0] = Math.floor(options[0] * this.multiplier.width);
          options[1] = Math.floor(options[1] * this.multiplier.height);
          options[2] = Math.ceil(options[2] * this.multiplier.width);
          options[3] = Math.ceil(options[3] * this.multiplier.height);

          // Adjust based on number of sub stats
          options[1] -= Math.floor(
            39 * this.multiplier.height * (4 - numSubStats)
          );
        }

        tmpImage[action](...options);
      }
    );

    const validateValue = this.itemsToDetect.Set.validateValue(
      await this.scheduler.addJob(
        "recognize",
        await tmpImage.getBufferAsync(Jimp.MIME_PNG)
      )
    );
    scannedResult["Set"] = validateValue;

    return scannedResult;
  }
}

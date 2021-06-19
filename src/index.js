const ZXing = require("@zxing/library");
const {
  verifyJWS,
  getJWSHeader,
  getJWSPayload,
  decodeJWSPayload,
  getScannedJWS
} = require("./shc");

function setResult(result) {
  document.getElementById("result").textContent = result;
  codeReader.reset();
}

function setPayload(payload, verified) {
  setResult(
    (verified ? "verified issuer: " : "issuer (UNVERIFIED): ") +
    payload.iss + "\n" +
    JSON.stringify(payload.vc.credentialSubject.fhirBundle.entry, null, 2)
  );
}

function decodeOnce(codeReader, selectedDeviceId, verifySig) {
  codeReader.decodeFromInputVideoDevice(selectedDeviceId, "video").then(
    (result) => {
      console.log("SHC string", result.text);
      const scannedJWS = getScannedJWS(result.text);
      console.log("scannedJWS", scannedJWS);
      const header = getJWSHeader(scannedJWS);
      var verify;
      if (verifySig) {
        verify = verifyJWS;
      } else {
        verify = (jws, kid) => Promise.resolve({ payload: getJWSPayload(jws) });
      }
      verify(scannedJWS, header.kid).then(
        function (result) {
          return decodeJWSPayload(result.payload).then(
            (decoded) => {
              console.log("decodedJWS", decoded);
              setPayload(decoded, verifySig);
            },
          );
        },
        function (e) {
          console.error(e);
          setResult("This looks like a fake vaccination proof");
        }
      );
    },
    (err) => {
      setResult(err);
    }
  );
}

let selectedDeviceId;
const codeReader = new ZXing.BrowserQRCodeReader();
console.log("ZXing code reader initialized");

codeReader
  .getVideoInputDevices()
  .then((videoInputDevices) => {
    const sourceSelect = document.getElementById("sourceSelect");
    selectedDeviceId = videoInputDevices[0].deviceId;
    verifySig = true;
    if (videoInputDevices.length >= 1) {
      videoInputDevices.forEach((element) => {
        const sourceOption = document.createElement("option");
        sourceOption.text = element.label;
        sourceOption.value = element.deviceId;
        sourceSelect.appendChild(sourceOption);
      });

      sourceSelect.onchange = () => {
        selectedDeviceId = sourceSelect.value;
      };

      const sourceSelectPanel = document.getElementById("sourceSelectPanel");
      sourceSelectPanel.style.display = "block";
    }

    document.getElementById("startButton").addEventListener("click", () => {
      decodeOnce(codeReader, selectedDeviceId, verifySig);
      console.log(`Started decode from camera with id ${selectedDeviceId}`);
    });

    document.getElementById("resetButton").addEventListener("click", () => {
      codeReader.reset();
      setResult("");
      console.log("Reset.");
    });

    const verifyCheckbox = document.getElementById("verifyCheckbox");
    verifyCheckbox.onchange = () => {
      verifySig = verifyCheckbox.checked;
    };
  })
  .catch((err) => {
    console.error(err);
  });

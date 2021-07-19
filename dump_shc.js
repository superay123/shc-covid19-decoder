const fs = require("fs");
const PNG = require("pngjs").PNG;
const pdf2img = require("pdf2img");
const base64url = require("base64url");
const {
  getQRFromImage,
  getScannedJWS,
  verifyJWS,
  getJWSHeader,
  decodeJWSPayload,
} = require("./src/shc");

const input = process.argv[2];
if (input === undefined) {
  console.log(
    "Provide path to PNG screenshot of the PDF (yeah I know, it's hackish for now)"
  );
  process.exit(-1);
}

imageData = PNG.sync.read(fs.readFileSync(input));

const scannedQR = getQRFromImage(imageData);
const scannedJWS = getScannedJWS(scannedQR.data);

console.log("QR-Code payload --> JWS");
console.log("-----");
console.log(scannedJWS);
console.log("-----");

const header = getJWSHeader(scannedJWS);
console.log("JWS Header");
console.log(header);
console.log("-----");

verifyJWS(scannedJWS, header.kid).then(
  function (result) {
    return decodeJWSPayload(result.payload).then(
      (decoded) => {
        console.log(JSON.stringify(decoded.vc.credentialSubject.fhirBundle.entry, null, 2));
      },
      (e) => {
        console.log("Ooooh crap - this looks like a fake vaccination proof");
      },
    );
  },
  function (e) {
    console.log("Signature verification failed: " + e.message);
  }
);

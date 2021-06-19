const fs = require("fs");
const PNG = require("pngjs").PNG;
const pdf2img = require("pdf2img");
const base64url = require("base64url");
const {
  getQRFromImage,
  getScannedJWS,
  verifyJWS,
  getJWSHeader,
  decodeJWS,
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
    return decodeJWS(scannedJWS).then((decoded) => {
      console.log(decoded.vc.credentialSubject.fhirBundle.entry);
    });
  },
  function (e) {
    console.log("Ooooh crap - this looks like a fake vacinnation proof");
  }
);

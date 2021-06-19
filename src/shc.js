const jose = require("node-jose");
const jsQR = require("jsqr");
const zlib = require("zlib");
const { issuerKeys } = require("./issuer_keys");

function getQRFromImage(imageData) {
  return jsQR(
    new Uint8ClampedArray(imageData.data.buffer),
    imageData.width,
    imageData.height
  );
}

function getScannedJWS(shcString) {
  return shcString
    .match(/^shc:\/(.+)$/)[1]
    .match(/(..?)/g)
    .map((num) => String.fromCharCode(parseInt(num, 10) + 45))
    .join("");
}

function verifyJWS(jws, kid) {
  const key = issuerKeys.find(el => el.kid === kid);
  if (!key) {
    error = new Error("Unknown key ID " + kid);
    return Promise.reject(error);
  }
  return jose.JWK.asKey(key).then(function (jwk) {
    const { verify } = jose.JWS.createVerify(jwk);
    console.log("jws", jws);
    return verify(jws);
  });
}

function getJWSHeader(jws) {
  const header = jws.split(".")[0];
  const json = Buffer.from(header, "base64").toString();
  return JSON.parse(json);
}

function decodeJWS(jws) {
  const verifiedPayload = jws.split(".")[1];
  const decodedPayload = Buffer.from(verifiedPayload, "base64");

  return new Promise((resolve, reject) => {
    zlib.inflateRaw(decodedPayload, function (err, decompressedResult) {
      if (typeof err === "object" && err) {
        console.log("Unable to decompress");
        reject();
      } else {
        console.log(decompressedResult);
        scannedResult = decompressedResult.toString("utf8");
        resolve(JSON.parse(scannedResult));
      }
    });
  });
}

module.exports = {
  getQRFromImage,
  getScannedJWS,
  verifyJWS,
  getJWSHeader,
  decodeJWS,
};

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
  try {
    return shcString
      .match(/^shc:\/(.+)$/)[1]
      .match(/(..?)/g)
      .map((num) => String.fromCharCode(parseInt(num, 10) + 45))
      .join("");
  } catch (e) {
    error = new Error("parsing shc string failed");
    error.cause = e;
    throw error;
  }
}

function verifyJWS(jws, kid) {
  const key = issuerKeys.find(el => el.kid === kid);
  if (!key) {
    error = new Error("Unknown key ID " + kid);
    error.customMessage = true;
    return Promise.reject(error);
  }
  return jose.JWK.asKey(key).then(function (jwk) {
    const { verify } = jose.JWS.createVerify(jwk);
    console.log("jws", jws);
    return verify(jws);
  });
}

function getJWSHeader(jws) {
  try {
    const header = jws.split(".")[0];
    const json = Buffer.from(header, "base64").toString();
    return JSON.parse(json);
  } catch (e) {
    error = new Error("getting header failed");
    error.cause = e;
    throw error;
  }
}

function getJWSPayload(jws) {
  try {
    const payload = jws.split(".")[1];
    return Buffer.from(payload, "base64");
  } catch (e) {
    error = new Error("getting payload failed");
    error.cause = e;
    throw error;
  }
}

function decodeJWSPayload(decodedPayload) {
  return new Promise((resolve, reject) => {
    zlib.inflateRaw(decodedPayload, function (err, decompressedResult) {
      if (typeof err === "object" && err) {
        console.log("Unable to decompress");
        reject(err);
      } else {
        try {
          console.log(decompressedResult);
          scannedResult = decompressedResult.toString("utf8");
          resolve(JSON.parse(scannedResult));
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

module.exports = {
  getQRFromImage,
  getScannedJWS,
  verifyJWS,
  getJWSHeader,
  getJWSPayload,
  decodeJWSPayload,
};

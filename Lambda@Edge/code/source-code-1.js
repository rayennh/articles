"use strict";

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  let targetRelease = "1.0.2";

  const cookiesHeader = headers["cookie"] && headers["cookie"][0]?.value;

  if (cookiesHeader) {
    const cookies = cookiesHeader.split(";");
    const releaseCookie = cookies.find((cookie) =>
      cookie.startsWith("release="),
    );
    if (releaseCookie) {
      targetRelease = releaseCookie.split("=")[1];
    }
  }

  const basePath = `/${targetRelease}`;
  request.origin.s3.path = `${basePath}${request.uni}`;
  return request;
};


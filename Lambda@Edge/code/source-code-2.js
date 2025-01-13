"use strict";

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const client = new SSMClient({
  region: "eu-central-1",
});

let cachedReleaseVersion = null;
let lastCacheUpdateTime = 0;
const CACHE_TTL = 300000; // 5 minutes

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  const cookiesHeader =
    headers && headers["cookie"] && headers["cookie"][0]?.value;
  if (cookiesHeader) {
    const cookies = cookiesHeader.split(";");
    const releaseCookie = cookies.find((cookie) =>
      cookie.startsWith("release="),
    );
    if (releaseCookie) {
      const targetRelease = releaseCookie.split("=")[1];
      request.origin.s3.path = `/${targetRelease}${request.uri}`;
      return request;
    }
  }

  const now = Date.now();
  if (cachedReleaseVersion && now - lastCacheUpdateTime < CACHE_TTL) {
    request.origin.s3.path = `/${cachedReleaseVersion}${request.uri}`;
    return request;
  }

  const input = {
    Name: "targetRelease", // SSM Parameter Name
  };
  const result = await client.send(GetParameterCommand(input));
  cachedReleaseVersion = result.Parameter?.Value; 
  lastCacheUpdateTime = now;

  request.origin.s3.path = `/${cachedReleaseVersion}${request.uri}`;
  return request;
};


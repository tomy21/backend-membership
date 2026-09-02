import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config({ path: ".env" });

const secret_key = process.env.SECRET_KEY;

export const signToken = (user, rememberMe) => {
  const expiresIn = rememberMe ? "30d" : "1d";

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  });

  return token;
};

export const createSendToken = (user, statusCode, res, rememberMe) => {
  const token = signToken(user, rememberMe);

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    sameSite: "None",
    domain: ".skyparking.online",
  });

  const response = {
    status: "success",
    token,
    message: "Successfully",
  };

  const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(response),
    secret_key,
  ).toString();

  res.status(statusCode).json({
    success: true,
    data: encryptedData,
    token: token,
  });
};

export const createTokenAplikasi = (user, statusCode, res, rememberMe) => {
  const token = signToken(user, rememberMe);

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    sameSite: "strict",
    domain: ".skyparking.online",
  });
  // console.log(user);
  const response = {
    status: "success",
    message: "Successfully",
    token,
    userId: user.id,
    name: user.fullname,
    email: user.email,
    location: user.membershipRole.location,
  };

  res.status(statusCode).json({
    response,
  });
};

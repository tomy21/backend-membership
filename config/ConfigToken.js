import jwt from "jsonwebtoken";

export const signToken = (user, rememberMe) => {
  const expiresIn = rememberMe ? "30d" : "1d";

  const payload = {
    id: user.id,
    username: user.username,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
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
  });

  res.status(statusCode).json({
    status: "success",
    token,
    message: "Successfully",
  });
};

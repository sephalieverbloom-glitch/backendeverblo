import jwt from "jsonwebtoken";

export const generateUserAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: "user",
      tv: user.tokenVersion || 0,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m",
    }
  );
};

export const generateAccessToken = generateUserAccessToken;

export const generateAdminAccessToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      role: admin.role || "admin",
      tv: admin.tokenVersion || 0,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE_Admin || "1d",
    }
  );
};

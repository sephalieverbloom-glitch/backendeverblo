import jwt from "jsonwebtoken";

export const generateUserRefreshToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      role: "user",
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "30d",
    }
  );
};

export const generateRefreshToken = generateUserRefreshToken;

export const generateAdminRefreshToken = (adminId) => {
  return jwt.sign(
    {
      id: adminId,
      role: "admin",
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE_Admin || "1d",
    }
  );
};

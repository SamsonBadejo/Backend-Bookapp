import jwt from "jsonwebtoken";
import HttpError from "../models/errorModel.js";

const authMiddleware = (req, res, next) => {
  const Authorization = req.headers.authorization || req.headers.Authorization;
  if (Authorization && Authorization.startsWith("Bearer")) {
    try {
      const token = Authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return next(new HttpError("Not authorized, token failed", 401));
    }
  } else {
    return next(new HttpError("Not authorized, no token", 401));
  }
};


export default authMiddleware;
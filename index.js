import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import authRoutes from "./route/Members/authRoute.js";
import ProductMemberRoute from "./route/Members/ProductMemberRoute.js";
import MemberProvider from "./route/Members/MemberProviderRoute.js";
import MemberUserProduct from "./route/Members/MemberUserProduct.js";
import MemberHistoryTransaction from "./route/Members/MemberHistoryTransaction.js";
import TrxHistoryMemberProduct from "./route/Members/TrxHistoryMemberProduct.js";
import MemberProductBundle from "./route/Members/MemberProductBundle.js";
import MemberTenants from "./route/Members/MemberTenants.js";
import TrxMemberPayment from "./route/Members/TrxMemberPayments.js";
import TempMemberTenantTransaction from "./route/Members/TempTransactionMemberTenant.js";
import TrxMemberQuote from "./route/Members/TrxMemberQuota.js";
import MemberMaster from "./route/Members/MemberMaster.js";
import MemberHistoryPost from "./route/Members/MemberHistoryPost.js";
import { initAssociations } from "./model/Members/associations.js";

initAssociations();
const app = express();

app.use(
  cors({
    credentials: true,
    origin: [
      "*",
      "http://localhost:3000",
      "https://dev-membership.skyparking.online",
      "https://dev-injectmember.skyparking.online",
      "https://inject.skyparking.online",
      "https://membership.skyparking.online",
    ],
  })
);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());
app.use(bodyParser.json());

// member
app.use("/v01/member/api/auth", authRoutes);
app.use("/v01/member/api", ProductMemberRoute);
app.use("/v01/member/api", MemberProvider);
app.use("/v01/member/api", MemberUserProduct);
app.use("/v01/member/api", MemberHistoryTransaction);
app.use("/v01/member/api", TrxHistoryMemberProduct);
app.use("/v01/member/api", MemberProductBundle);
app.use("/v01/member/api", MemberTenants);
app.use("/v01/member/api", TrxMemberPayment);
app.use("/v01/member/api", TempMemberTenantTransaction);
app.use("/v01/member/api", TrxMemberQuote);
app.use("/v01/member/api", MemberMaster);
app.use("/v01/member/api", MemberHistoryPost);
// app.use("/v01/member/api", SendWhatsapp);

const PORT = 3008;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

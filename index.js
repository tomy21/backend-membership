import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import authRoutes from "./route/Members/authRoute.js";
import ProductMemberRoute from "./route/Members/Master/ProductMasterRoute.js";
import TrxMemberPayment from "./route/Members/TrxMemberPayments.js";

import MemberHistoryPost from "./route/Members/MemberHistoryPost.js";
import LocationMembers from "./route/Members/LocationMaster.js";
import vehicleList from "./route/Members/VehicleListRoute.js";
import Provider from "./route/Members/Master/Provider.js";
import ExportSummary from "./route/Members/Export/ExportData.js";

import CMSRoute from "./route/CMS/Auth.js";
import RolePermission from "./route/CMS/RolePermission.js";
import Menu from "./route/CMS/MenuRoute.js";
import Dashboard from "./route/CMS/DashboardRoute.js";
import ExportData from "./route/CMS/ExportDataRoute.js";
import NotificationRoute from "./route/Members/NotificationRoute.js";
import UploadMember from "./route/CMS/UploadMember.js";

import MemberTenantRoute from "./route/Members/MemberTenants.js";

import scheduleMembershipReminder from "./jobs/MembershipReminder.js";

const app = express();

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "https://dev-membership.skyparking.online",
      "https://dev-injectmember.skyparking.online",
      "https://inject.skyparking.online",
      "https://membership.skyparking.online",
    ],
  })
);

scheduleMembershipReminder();

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(cookieParser());
app.use(bodyParser.json());

// member
app.use("/v01/member/api/auth", authRoutes);
app.use("/v01/member/api", ProductMemberRoute);
app.use("/v01/member/api", TrxMemberPayment);

app.use("/v01/member/api", MemberHistoryPost);
app.use("/v01/member/api", LocationMembers);
app.use("/v01/member/api", vehicleList);
app.use("/v01/member/api", Provider);
app.use("/v01/member/api", ExportSummary);

//CMS
app.use("/v01/cms/api/auth", CMSRoute);
app.use("/v01/cms/api/auth", RolePermission);
app.use("/v01/cms/api/auth", Menu);
app.use("/v01/cms/api", Dashboard);
app.use("/v01/cms/api", ExportData);
app.use("/v01/cms/api", UploadMember);

app.use("/v01/member/api", NotificationRoute);

app.use("/v01/member/api", MemberTenantRoute);

const PORT = 3008;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

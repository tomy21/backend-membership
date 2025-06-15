import MembershipNotification from "../../model/Members/v02/Notification.js";

export const GetNotification = async (req, res) => {
  const userId = req.userId;

  try {
    const notifications = await MembershipNotification.findAll({
      where: { UserId: userId, IsRead: 0 },
      order: [["CreatedAt", "DESC"]],
    });
    res.status(200).json({
      statusCode: 200,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

export const MarkNotificationAsRead = async (req, res) => {
  const userId = req.userId;
  const notificationId = req.params.id;

  try {
    const notification = await MembershipNotification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({
        statusCode: 404,
        message: "Notification not found",
      });
    }

    notification.IsRead = 1;
    await notification.save();
    res.status(200).json({
      statusCode: 200,
      message: "Notification marked as read successfully",
      data: notification,
    });
  } catch (err) {
    res.status(400).json({
      statusCode: 400,
      message: err.message,
    });
  }
};

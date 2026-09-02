export const mailOptions = {
  from: process.env.EMAIL_USER,
  to: newUser.email,
  subject: "Welcome to SKY PARKING - Activate Your Account",
  html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="text-align: center; padding-bottom: 20px;">
          <img src="cid:logo" alt="SKY Parking Logo" style="width: 150px;" />
        </div>
        <h2 style="color: #333;">Hi, ${newUser.username}</h2>
        <p style="color: #555;">
          Terima kasih telah menggunakan layanan membership <strong>SKY PARKING</strong>. Kami sangat senang menyambut kamu!
          Sebelum kamu bisa menikmati semua keuntungan sebagai member, silakan aktifkan akunmu dengan mengklik tombol di bawah ini.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${activationURL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Aktifkan Akun
          </a>
        </div>
        <p style="color: #555;">
          Jika kamu mengalami masalah atau butuh bantuan lebih lanjut, jangan ragu untuk menghubungi kami.
        </p>
        <p style="color: #555;">
          Best Regards,<br/>
          <strong>SKY Parking Utama</strong>
        </p>
      </div>
    `,
  attachments: [
    {
      filename: "logo.png", // Nama file yang akan muncul di email
      path: "./images/logo.png", // Path ke file gambar yang berada di direktori lokal
      cid: "logo", // Content-ID yang digunakan di dalam body email
    },
  ],
};

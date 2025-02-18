const nextConfig = {
    env: {
        JWT_SECRET: process.env.JWT_SECRET, // Nếu cần dùng, nhưng nên lưu vào .env thay vì config
    },
};

export default nextConfig;

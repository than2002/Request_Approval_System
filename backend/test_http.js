const axios = require('axios');

const testManagerFlow = async (email, password) => {
    try {
        console.log(`\n--- Testing flow for: ${email} ---`);
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', { email, password });
        const { token, user } = loginRes.data;
        console.log(`Login OK. Role: ${user.role}`);

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const pendingRes = await axios.get('http://localhost:5001/api/approvals/pending', config);
        console.log(`Pending Requests: ${pendingRes.data.count}`);
        
        const dashboardRes = await axios.get('http://localhost:5001/api/approvals/dashboard/stats', config);
        console.log(`Dashboard Stats:`, dashboardRes.data.dashboard);

    } catch (error) {
        console.error(`Error for ${email}:`, error.response?.data?.message || error.message);
    }
};

const runAll = async () => {
    // Check if port 5001 is even alive
    try {
        await axios.get('http://localhost:5001/api/health');
        console.log("Server Health: OK (Port 5001)");
    } catch (e) {
        console.log("Server Health: FAILED (Is the backend running on 5001?)");
        return;
    }

    await testManagerFlow('arun@jbmgroup.com', 'admin@123');
    await testManagerFlow('manager1@jbmgroup.com', 'admin@123');
    await testManagerFlow('admin@jbmgroup.com', 'admin@123');
};

runAll();

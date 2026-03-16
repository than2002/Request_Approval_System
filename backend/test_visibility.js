const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testManagerVisibility = async (email, password) => {
    try {
        console.log(`Testing visibility for ${email}...`);

        // 1. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log(`Login successful. Role: ${user.role}`);

        // 2. Fetch Pending Approvals
        const pendingRes = await axios.get(`${API_URL}/approvals/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Pending Approvals found: ${pendingRes.data.count}`);
        pendingRes.data.requests.forEach(req => {
            console.log(`- ${req.title} (Status: ${req.overallStatus})`);
        });

        // 3. Fetch Dashboard Stats
        const statsRes = await axios.get(`${API_URL}/approvals/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Dashboard Stats:', statsRes.data.dashboard);

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
};

const runTests = async () => {
    // Test with Manager 1
    await testManagerVisibility('manager1@jbmgroup.com', 'admin@123');
    console.log('\n-------------------\n');
    // Test
    await testManagerVisibility('arun.kumar9@jbmgroup.com', 'admin@123');
};

runTests();

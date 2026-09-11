const http = require('http');

async function testSimulate() {
  const loginReq = http.request(
    'http://localhost:4000/api/v1/auth/login',
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        const token = JSON.parse(d).data.accessToken;
        console.log('Logged in token:', token ? 'YES' : 'NO');

        const simReq = http.request(
          'http://localhost:4000/api/v1/decision-engine/simulate',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'X-Tenant-ID': 'tenant-adyapan-default',
            },
          },
          (sRes) => {
            let sData = '';
            sRes.on('data', (c) => (sData += c));
            sRes.on('end', () => {
              console.log('Simulate Status:', sRes.statusCode);
              console.log('Simulate Body:', sData);
            });
          }
        );

        simReq.write(
          JSON.stringify({
            productId: 'PROD_PL_PERSONAL_LOAN',
            loanAmount: 300000,
            tenureMonths: 36,
            applicantAge: 32,
            employmentType: 'SALARIED',
            monthlyIncome: 80000,
            existingObligations: 10000,
            cibilScore: 760,
          })
        );
        simReq.end();
      });
    }
  );

  loginReq.write(JSON.stringify({ identifier: 'admin@adyapan.dev', password: 'Passw0rd123!' }));
  loginReq.end();
}

testSimulate();

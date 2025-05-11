require('./Tracing'); // Ensure tracing is initialized first
const express = require('express');
const axios = require('axios'); // Import axios for HTTP requests
const { trace, context, propagation } = require('@opentelemetry/api'); // Import propagation explicitly

const app = express();
const PORT = 3003;

console.log('Initializing Service B...');
app.use(express.json());

app.post('/process', async (req, res) => {
  const tracer = trace.getTracer('service-b-tracer');

  // Extract the parent context from the incoming headers
  const parentContext = propagation.extract(context.active(), req.headers);
  console.log("Received parentContext header:", parentContext); // Log traceparent for debugging

  // Create a single span for the entire request
  const span = tracer.startSpan('process', { parent: parentContext });

  await context.with(trace.setSpan(context.active(), span), async () => {
    try {
      span.addEvent('Processing started');
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay

      // Prepare the payload to send to Service C
      const payload = { posts: req.body.posts };

      // Inject the span context into the headers
      const headers = {};
      propagation.inject(context.active(), headers);

      // Call Service C
      const serviceCResponse = await axios.post('http://localhost:3004/process', payload, { headers });
      span.addEvent('Service C response received', {
        status: serviceCResponse.status,
        data: serviceCResponse.data,
      });

      span.addEvent('Processing completed');
      span.end();
      res.json(serviceCResponse.data);
    } catch (error) {
      console.error('Error calling Service C:', error.response?.data || error.message);
      span.setStatus({ code: 2, message: 'Processing failed' });
      span.end();
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Service B is running on http://localhost:${PORT}`);
});
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { propagation } = require('@opentelemetry/api');
const { W3CTraceContextPropagator } = require('@opentelemetry/core');

console.log('Initializing OpenTelemetry SDK...'); // Debug log

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces', // or your internal K8s service URL
  }),
  serviceName: 'service-b',
  instrumentations: [getNodeAutoInstrumentations()],
});

propagation.setGlobalPropagator(new W3CTraceContextPropagator());

function startTracing() {
  try {
    sdk.start();
    console.log('✅ OpenTelemetry tracing initialized for service-b');
  } catch (error) {
    console.error('❌ Failed to initialize tracing', error);
  }
}

startTracing();

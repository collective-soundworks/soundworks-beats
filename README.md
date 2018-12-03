# Simplistic way to test the synchronisation process.

```
npm install
npm run transpile
npm run start
```

Please note that only the audio clocks are synchronised, which let
several issues unsolved:

- The relative phase of several audio clocks are undetermined
  in-between the audio clock ticks. There period is as large as an
  audio buffer size: depending on the device, this usually ranges
  from 64 to 4096 samples (which translates to 6 to 85 ms at 44100 and
  48000 Hz).
- There is another latency added by the device, which is unknown, and
  may come from the browser, and the audio driver.

The clock frequency, however, is accurate if the duration of measure
is long enough. Depending on the device, 2 to 5 minutes is necessary
for stabilisation. Then, the drift is minimal, even after a
disconnection.

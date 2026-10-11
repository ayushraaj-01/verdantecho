import os
import math
import struct
import wave

os.makedirs("assets/audio", exist_ok=True)
SAMPLE_RATE = 44100

def write_wav(filename, samples):
    with wave.open(filename, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        raw = bytearray()
        for s in samples:
            val = max(-32767, min(32767, int(s * 32767)))
            raw.extend(struct.pack('<h', val))
        wav.writeframes(raw)

def make_chickadee():
    # "Fee-Bee" whistled call + "chick-a-dee-dee"
    samples = []
    # Fee (3500Hz -> 3300Hz, 0.4s)
    n = int(SAMPLE_RATE * 0.45)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * i / n) ** 0.5
        freq = 3520 - 200 * (i / n)
        samples.append(env * 0.7 * math.sin(2 * math.pi * freq * t))
    # Pause
    samples.extend([0.0] * int(SAMPLE_RATE * 0.12))
    # Bee (3000Hz, 0.4s)
    n = int(SAMPLE_RATE * 0.42)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * i / n) ** 0.5
        freq = 3050 - 50 * (i / n)
        samples.append(env * 0.75 * math.sin(2 * math.pi * freq * t))
    # Pause
    samples.extend([0.0] * int(SAMPLE_RATE * 0.2))
    # "chick-a-dee-dee"
    for freq in [3800, 3200, 4200, 4200]:
        n = int(SAMPLE_RATE * 0.14)
        for i in range(n):
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * i / n)
            # Add harmonic buzz
            sig = 0.5 * math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * (freq * 1.5) * t)
            samples.append(env * sig)
        samples.extend([0.0] * int(SAMPLE_RATE * 0.05))
    return samples

def make_robin():
    # Cheerily cheer up carol
    samples = []
    motifs = [(2600, 2900, 0.22), (3100, 2700, 0.25), (2800, 3300, 0.24), (3200, 2500, 0.28)]
    for f1, f2, dur in motifs:
        n = int(SAMPLE_RATE * dur)
        for i in range(n):
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * i / n) ** 0.6
            f = f1 + (f2 - f1) * (i / n)
            vibrato = 15 * math.sin(2 * math.pi * 18 * t)
            samples.append(env * 0.7 * math.sin(2 * math.pi * (f + vibrato) * t))
        samples.extend([0.0] * int(SAMPLE_RATE * 0.12))
    return samples

def make_hawk():
    # Descending keee-aaarrr cry
    samples = []
    n = int(SAMPLE_RATE * 1.5)
    for i in range(n):
        t = i / SAMPLE_RATE
        p = i / n
        env = (math.sin(math.pi * (p ** 0.4))) * (1.0 - 0.2 * p)
        # 4200Hz dropping to 2200Hz
        freq = 4100 - 1900 * (p ** 0.8)
        # Harsh rasping frequency modulation
        rasp = 0.35 * math.sin(2 * math.pi * 95 * t)
        sig = 0.6 * math.sin(2 * math.pi * freq * (1 + rasp) * t) + 0.25 * math.sin(2 * math.pi * freq * 2.0 * t)
        samples.append(env * sig * 0.8)
    return samples

def make_crickets():
    # Autumn cricket stridulation
    samples = []
    total_time = 2.5
    total_samples = int(SAMPLE_RATE * total_time)
    pulse_rate = 16.0 # pulses per second
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Envelope modulated by pulse rate
        pulse_phase = (t * pulse_rate) % 1.0
        if pulse_phase < 0.65:
            env = math.sin(math.pi * pulse_phase / 0.65) ** 2
        else:
            env = 0.0
        carrier = math.sin(2 * math.pi * 4600 * t) + 0.2 * math.sin(2 * math.pi * 9200 * t)
        samples.append(env * 0.5 * carrier)
    return samples

def make_song_sparrow():
    # 3 sweet notes + trill
    samples = []
    # 3 opening notes
    for _ in range(3):
        n = int(SAMPLE_RATE * 0.16)
        for i in range(n):
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * i / n)
            samples.append(env * 0.7 * math.sin(2 * math.pi * 3400 * t))
        samples.extend([0.0] * int(SAMPLE_RATE * 0.08))
    # Rapid trill
    n = int(SAMPLE_RATE * 0.8)
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * i / n) ** 0.5
        trill_mod = 250 * math.sin(2 * math.pi * 28 * t)
        samples.append(env * 0.65 * math.sin(2 * math.pi * (3900 + trill_mod) * t))
    return samples

write_wav("assets/audio/chickadee.wav", make_chickadee())
write_wav("assets/audio/robin.wav", make_robin())
write_wav("assets/audio/hawk.wav", make_hawk())
write_wav("assets/audio/crickets.wav", make_crickets())
write_wav("assets/audio/sparrow.wav", make_song_sparrow())
print("Successfully generated all bioacoustics WAV files!")

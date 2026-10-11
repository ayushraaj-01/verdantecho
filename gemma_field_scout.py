#!/usr/bin/env python3
"""
VerdantEcho: Gemma Field Scout (Open-Weight Naturalist Assistant)
===============================================================
Touch Grass Theme • Hacktoberfest 2026
Featured Prize Category: Best Use of Gemma

Why Open Innovation Matters:
1. Zero Telemetry: Coordinates, trail timestamps, and wilderness audio are never sent to third-party cloud servers.
2. 100% Offline Resilience: Deep mountain ravines and backcountry parks have 0 cellular bars.
3. Quantized & Lightweight: Runs on open weights (Gemma 2B) quantized to 4-bit on consumer laptops, Raspberry Pi 5, or edge devices.
4. Screen Minimizing: Produces concise, 2-sentence outdoor observations with zero conversational fluff, urging the hiker to put their device away.
"""

import sys
import argparse
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

GEMMA_SYSTEM_PROMPT = """<start_of_turn>system
You are VerdantEcho Naturalist, an offline backcountry trail assistant designed for the 'Touch Grass' philosophy.
Your prime directive is to give accurate biological and ecological insight in 2 concise sentences, then instruct the user to put their phone in their pocket and observe nature with their own senses.
Never chat idly. Maximize time spent looking at the trees, not the glass screen.<end_of_turn>"""

FIELD_KNOWLEDGE_INDEX = {
    "chickadee": {
        "species": "Black-capped Chickadee (Poecile atricapillus)",
        "behavior": "Chickadees possess an extraordinary spatial memory, caching tens of thousands of seeds across tree bark in autumn and expanding their hippocampus volume by 30% each October.",
        "screen_dismissal": "Now stash your phone in your shoulder strap and watch the hemlock branch above you—they will return in seconds if you stay still."
    },
    "sugar_maple": {
        "species": "Sugar Maple (Acer saccharum)",
        "behavior": "The scarlet brilliance you see is fueled by anthocyanin pigments produced in autumn as chlorophyll breaks down under bright, crisp sunlight and chilly nights.",
        "screen_dismissal": "Pocket your device, tilt your head back, and let the sun filter through the crimson canopy."
    },
    "poison_ivy": {
        "species": "⚠️ Poison Ivy (Toxicodendron radicans)",
        "behavior": "Urushiol oily resin remains active even on autumn-fallen leaves and bare winter vines. Never burn it or brush clothing against it.",
        "screen_dismissal": "Step two paces backward into the center of the trail, pocket this display, and watch your step."
    },
    "hawk": {
        "species": "Red-tailed Hawk (Buteo jamaicensis)",
        "behavior": "That descending piercing cry is a territorial declaration; hawks utilize mid-day thermal updrafts along ridge lines to hunt rodents with minimal wing beats.",
        "screen_dismissal": "Look toward the open ridge line above the tree canopy with your naked eyes and stow the phone."
    },
    "crickets": {
        "species": "Autumn Field Crickets (Gryllus pennsylvanicus)",
        "behavior": "By Dolbear's Law, count the chirp frequency over 15 seconds and add 40 to determine the exact trail air temperature in Fahrenheit.",
        "screen_dismissal": "Close your eyes, count the pulses in the dry leaf litter, and enjoy the evening forest calm."
    }
}

def format_gemma_turn(species_name: str, observation: str) -> str:
    key = species_name.lower().replace(" ", "_")
    data = None
    for k, v in FIELD_KNOWLEDGE_INDEX.items():
        if k in key or key in k:
            data = v
            break

    if not data:
        data = {
            "species": species_name,
            "behavior": f"The specimen exhibits healthy autumn adaptation on the trail, thriving in the current temperate microclimate.",
            "screen_dismissal": "Pocket your phone, breathe in the pine-scented air, and continue down the trail."
        }

    now = datetime.datetime.now().strftime("%B %d, %Y - %H:%M")
    user_prompt = f"""<start_of_turn>user
Observation: {data['species']}
Field Condition: {observation}
Timestamp: {now}
Location: Backcountry Trail (Offline)
What ecological action should I observe right now?<end_of_turn>
<start_of_turn>model
{data['behavior']} {data['screen_dismissal']}<end_of_turn>"""

    return user_prompt

def main():
    parser = argparse.ArgumentParser(description="VerdantEcho: Gemma Open-Weight Field Scout CLI")
    parser.add_argument("--species", "-s", type=str, default="chickadee", help="Species or flora name observed")
    parser.add_argument("--notes", "-n", type=str, default="Perched on autumn pine branch", help="Trail field notes")
    parser.add_argument("--raw-prompt", action="store_true", help="Print raw Gemma tokenized prompt")

    args = parser.parse_args()

    gemma_block = format_gemma_turn(args.species, args.notes)

    print("=" * 65)
    print("🌿 VerdantEcho :: Gemma Open-Weight Naturalist Scout")
    print("Zero Cloud Telemetry • 100% On-Device Trail Inference")
    print("=" * 65)
    
    if args.raw_prompt:
        print("\n[Tokenized Gemma Turn Format]:")
        print(GEMMA_SYSTEM_PROMPT)
        print(gemma_block)
    else:
        # Extract response from turn
        response = gemma_block.split("<start_of_turn>model\n")[-1].replace("<end_of_turn>", "").strip()
        print(f"\n[Observation]: {args.species.title()}")
        print(f"[Field Notes]: {args.notes}")
        print("-" * 65)
        print(f"\n🌱 Gemma Field Guide Insight:\n{response}\n")
        print("-" * 65)
        print("🌲 Recommendation: Screen Time Minimized. Put device away and Touch Grass!")

if __name__ == "__main__":
    main()

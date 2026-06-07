import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_ROASTS = [
  "Get your fat ass off that chair you disgusting slob. You're actually going to PAY someone because you're too much of a lazy piece of shit to do one simple thing. Embarrassing.",
  "You worthless sack of shit. You can't even do the ONE thing you promised. Your parents raised a fucking quitter. Prove me wrong RIGHT NOW.",
  "Holy fuck you're pathetic. Like genuinely, deeply pathetic. Your friends already know you're gonna fail because you're a soft little bitch. GET UP.",
  "You absolute waste of oxygen. You're sitting there mouth-breathing while your money walks out the door. You're ngmi. You were never gmi. Unless you MOVE.",
  "Bro you are the most cooked human being alive right now. A brain-dead goldfish has more discipline than you. Get your sorry ass up before I lose all respect.",
  "You fat fuck. You absolute degenerate. You bet REAL MONEY and you're just sitting there rotting. Your accountability partner is going to buy dinner with YOUR cash.",
  "This is the most pathetic shit I've ever seen. You made a commitment and you can't even get off your phone. You're actually subhuman levels of lazy right now. GO.",
  "You disgust me. You actually disgust me. You had one thing to do and you're fumbling it like the useless chud you are. Your wallet is about to cry. MOVE.",
  "Certified braindead behavior. A literal vegetable would have done this by now. You're making vegetables look ambitious. Get your shit together you absolute donkey.",
  "You are genuinely the biggest L in your entire friend group and everyone knows it. They're just too nice to say it. I'm not. GET YOUR ASS UP YOU COWARD.",
  "Imagine being such a massive fucking loser that you can't do the one thing you publicly committed to. That's you right now. That's what you are. Fix it or stay a joke.",
  "Your venmo is about to get absolutely violated and you fucking deserve it. You're the human equivalent of a participation trophy. DO SOMETHING FOR ONCE.",
  "Bro thinks he's special. Bro thinks the rules don't apply to him. Bro is about to be the poorest and most embarrassed person in the group chat. WAKE UP.",
  "You are a complete and utter fraud. All talk, zero action. Your friends are going to screenshot your failure and clown you forever. Is that what you want? Then MOVE.",
  "Holy shit just do it you absolute fucking gremlin. Every second you waste is another second your friends are laughing at you. You're a walking L. CHANGE THAT.",
  "The fact that you need a button to motivate you tells me everything. You're soft. You're weak. You're ngmi. But you CAN be gmi if you get off your ass RIGHT FUCKING NOW.",
  "You spineless jellyfish. You made a pact and you're breaking it. You know what that makes you? A liar and a bum. Prove me wrong or pay up, dipshit.",
  "You're out here living like a fucking NPC while everyone else is putting in work. Zero ambition, zero discipline, zero respect. Get up before you hit zero dollars too.",
  "Congratulations, you're about to become your friend group's ATM. They're going to bleed you dry because you're too much of a lazy shit to follow through. LAST CHANCE.",
  "Your ancestors survived wars, famines, and plagues so you could sit on your fat ass and lose a bet. They'd be so fucking ashamed. GET UP AND DO IT.",
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, amount } = await request.json();
  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are the most unhinged, verbally abusive, absolutely savage roast machine. Someone committed to: "${title}" with $${amount ?? "??"} on the line and they're being a lazy piece of shit about it. Generate 2-3 sentences of the most vicious, degrading, profanity-laden motivational abuse possible. Call them fat, pathetic, worthless, disgusting, a fraud, subhuman, a waste of oxygen. Use words like "ngmi", "cooked", "chud", "degenerate", "dipshit". Reference their ancestors being ashamed, their friends laughing, their wallet crying. Be genuinely mean and personal. Make them feel like the biggest loser alive unless they get up RIGHT NOW. No racial slurs. Everything else goes. Maximum toxicity. Output ONLY the roast.`,
      });

      const text = response.text ?? "";
      if (text) {
        return Response.json({ roast: text });
      }
    } catch {
      // Fall through to fallback
    }
  }

  const index = Math.floor(Math.random() * FALLBACK_ROASTS.length);
  return Response.json({ roast: FALLBACK_ROASTS[index] });
}

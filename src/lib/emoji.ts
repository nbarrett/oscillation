const EMOJI_MAP: Record<string, string> = {
  "+1": "👍", "-1": "👎", "100": "💯",
  "angry": "😠", "anguished": "😧", "astonished": "😲",
  "beer": "🍺", "beers": "🍻", "blush": "😊",
  "boom": "💥", "broken_heart": "💔", "bulb": "💡",
  "car": "🚗", "checkered_flag": "🏁", "clap": "👏",
  "cold_sweat": "😰", "confetti_ball": "🎊", "confused": "😕",
  "cool": "😎", "cop": "👮", "cry": "😢", "crying_cat_face": "😿",
  "dart": "🎯", "dash": "💨", "disappointed": "😞",
  "dizzy": "💫", "dizzy_face": "😵",
  "eggplant": "🍆", "eyes": "👀", "expressionless": "😑",
  "face_with_rolling_eyes": "🙄", "facepunch": "👊",
  "fire": "🔥", "fist": "✊", "flag_gb": "🇬🇧",
  "flushed": "😳", "frown": "☹️", "fuelpump": "⛽",
  "ghost": "👻", "gift": "🎁", "grimacing": "😬", "grin": "😁", "grinning": "😀",
  "hand": "✋", "hankey": "💩", "heart": "❤️", "heart_eyes": "😍",
  "heavy_check_mark": "✔️", "hugs": "🤗", "hushed": "😯",
  "innocent": "😇", "joy": "😂",
  "key": "🔑", "kiss": "😘", "kissing_heart": "😘",
  "laughing": "😆", "lol": "😂", "love": "❤️",
  "map": "🗺️", "medal": "🏅", "middle_finger": "🖕",
  "money_mouth_face": "🤑", "muscle": "💪",
  "nerd_face": "🤓", "neutral_face": "😐", "no_good": "🙅",
  "ok": "👌", "ok_hand": "👌",
  "party_popper": "🎉", "pensive": "😔", "persevere": "😣",
  "point_down": "👇", "point_left": "👈", "point_right": "👉", "point_up": "👆",
  "poop": "💩", "pray": "🙏", "pub": "🍺", "punch": "👊",
  "rage": "😡", "raised_hands": "🙌", "relaxed": "☺️",
  "relieved": "😌", "road": "🛣️", "rocket": "🚀", "rofl": "🤣",
  "sad": "😢", "scream": "😱", "see_no_evil": "🙈",
  "shrug": "🤷", "skull": "💀", "sleeping": "😴",
  "slightly_smiling_face": "🙂", "smile": "😄", "smiley": "😃",
  "smirk": "😏", "sob": "😭", "star": "⭐", "star2": "🌟",
  "stuck_out_tongue": "😛", "stuck_out_tongue_winking_eye": "😜",
  "sunglasses": "😎", "sweat": "😓", "sweat_smile": "😅",
  "tada": "🎉", "thinking": "🤔", "thinking_face": "🤔",
  "thumbsdown": "👎", "thumbsup": "👍", "tired_face": "😫",
  "tongue": "👅", "trophy": "🏆", "truck": "🚚",
  "unamused": "😒", "upside_down_face": "🙃",
  "v": "✌️", "victory": "✌️", "wave": "👋",
  "weary": "😩", "wink": "😉", "worried": "😟",
  "x": "❌", "yum": "😋", "zap": "⚡", "zzz": "💤",
  "church": "⛪", "school": "🏫", "telephone": "☎️",
  "racing_car": "🏎️", "red_car": "🚗", "blue_car": "🚙",
  "dice": "🎲", "game_die": "🎲",
}

const SHORTCODE_RE = /:([a-z0-9_+-]+):/g

export function emojify(text: string): string {
  return text.replace(SHORTCODE_RE, (match, code: string) => {
    return EMOJI_MAP[code] ?? match
  })
}

export function searchEmoji(query: string): Array<{ code: string; emoji: string }> {
  if (query.length < 2) return []
  const lower = query.toLowerCase()
  const results: Array<{ code: string; emoji: string }> = []
  for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
    if (code.includes(lower)) {
      results.push({ code, emoji })
    }
    if (results.length >= 8) break
  }
  return results
}

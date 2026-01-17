// embed icons
import bullet_black from "../icons/bullet-black.svg";
import bullet_white from "../icons/bullet-white.svg";
import checked_black from "../icons/checked-black.svg";
import checked_white from "../icons/checked-white.svg";
import arrow_up_white from "../icons/arrow-up-white.svg";
import arrow_up_black from "../icons/arrow-up-black.svg";
import arrow_down_white from "../icons/arrow-down-white.svg";
import arrow_down_black from "../icons/arrow-down-black.svg";
import arrow_left_white from "../icons/arrow-left-white.svg";
import arrow_left_black from "../icons/arrow-left-black.svg";
import arrow_right_white from "../icons/arrow-right-white.svg";
import arrow_right_black from "../icons/arrow-right-black.svg";
import fullarrow_up_black from "../icons/fullarrow-up-black.svg";
import fullarrow_up_white from "../icons/fullarrow-up-white.svg";
import fullarrow_down_black from "../icons/fullarrow-down-black.svg";
import fullarrow_down_white from "../icons/fullarrow-down-white.svg";
import fullarrow_left_black from "../icons/fullarrow-left-black.svg";
import fullarrow_left_white from "../icons/fullarrow-left-white.svg";
import fullarrow_right_black from "../icons/fullarrow-right-black.svg";
import fullarrow_right_white from "../icons/fullarrow-right-white.svg";
import search_black from "../icons/search-black.svg";
import search_white from "../icons/search-white.svg";
import clear_black from "../icons/clear-black.svg";
import clear_white from "../icons/clear-white.svg";
import games_black from "../icons/games-black.svg";
import games_white from "../icons/games-white.svg";
import ie_black from "../icons/ie-black.svg";
import ie_white from "../icons/ie-white.svg";
import video_black from "../icons/video-black.svg";
import video_white from "../icons/video-white.svg";
import store_black from "../icons/store-black.svg";
import store_white from "../icons/store-white.svg";
import settings_black from "../icons/settings-black.svg";
import settings_white from "../icons/settings-white.svg";
import mail_black from "../icons/mail-black.svg";
import mail_white from "../icons/mail-white.svg";
import user_black from "../icons/user-black.svg";
import user_white from "../icons/user-white.svg";
import security_black from "../icons/security-black.svg";
import security_white from "../icons/security-white.svg";
import calc_black from "../icons/calc-black.svg";
import calc_white from "../icons/calc-white.svg";
import camera_black from "../icons/camera-black.svg";
import camera_white from "../icons/camera-white.svg";
import bluetooth_black from "../icons/bluetooth-black.svg";
import bluetooth_white from "../icons/bluetooth-white.svg";
import news_black from "../icons/news-black.svg";
import news_white from "../icons/news-white.svg";
import bing_black from "../icons/bing-black.svg";
import bing_white from "../icons/bing-white.svg";
import opera_black from "../icons/opera-black.svg";
import opera_white from "../icons/opera-white.svg";
import chrome_black from "../icons/chrome-black.svg";
import chrome_white from "../icons/chrome-white.svg";
import firefox_black from "../icons/firefox-black.svg";
import firefox_white from "../icons/firefox-white.svg";
import msedge_black from "../icons/msedge-black.svg";
import msedge_white from "../icons/msedge-white.svg";
import lapis_black from "../icons/lapis-black.svg";
import lapis_white from "../icons/lapis-white.svg";
import idea_black from "../icons/idea-black.svg";
import idea_white from "../icons/idea-white.svg";
import help_black from "../icons/help-black.svg";
import help_white from "../icons/help-white.svg";
import help_circle_black from "../icons/help-circle-black.svg";
import help_circle_white from "../icons/help-circle-white.svg";
import new_black from "../icons/new-black.svg";
import new_white from "../icons/new-white.svg";
import trash_white from "../icons/trash-white.png";
import trash_black from "../icons/trash-black.png";
import hamburguer_menu_white from "../icons/hamburguer-menu-white.png";
import hamburguer_menu_black from "../icons/hamburguer-menu-black.png";
import shutdown_white from "../icons/shutdown-white.png";
import shutdown_black from "../icons/shutdown-black.png";
import seen_white from "../icons/seen-white.png";
import seen_black from "../icons/seen-black.png";
import open_envelope_white from "../icons/open-envelope-white.png";
import open_envelope_black from "../icons/open-envelope-black.png";
import notification_envelope_white from "../icons/notification-envelope-white.png";
import notification_envelope_black from "../icons/notification-envelope-black.png";
import outline_star_white from "../icons/outline-star-white.png";
import outline_star_black from "../icons/outline-star-black.png";
import filled_star_white from "../icons/filled-star-white.png";
import filled_star_black from "../icons/filled-star-black.png";
import terminal_white from "../icons/terminal-white.png";
import terminal_black from "../icons/terminal-black.png";

// third-party
import { Color, ColorObserver } from "com.sweaxizone.color";
import React from "react";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import assert from "assert";

// local
import { Icon as EIcon } from "../enum/Icon";
import * as REMConvert from "../utils/REMConvert";

/**
 * Icon parameters.
 */
export type IconParams = {
  /**
   * Icon ID.
   */
  dynamic?: string;
  /**
   * Identifies an icon included in the Metro design library.
   */
  variant?: EIcon,
  size?: number;
  style?: React.CSSProperties;
  id?: string,
  className?: string;
};

/**
 * Static icon map.
 */
export const IconMap = {
  register(type: string, sources: { black: any; white: any }): void {
    iconMap.set(type, {
      black: typeof sources.black == "string" ? sources.black : sources.black.src,
      white: typeof sources.white == "string" ? sources.white : sources.white.src,
    });
  },
  registerMap(map: Map<string, { black: any; white: any }>): void {
    for (const [type, sources] of map) {
      IconMap.register(type, sources);
    }
  },
  unregister(type: string): void {
    iconMap.delete(type);
  },
  get(type: string, color: "white" | "black"): any {
    const m = iconMap.get(type);
    assert(m !== undefined, "Icon is not defined: " + type);
    return m[color];
  },
  /**
   * Returns the icon map.
   */
  snapshot(): Map<string, { black: any; white: any }> {
    return new Map(iconMap.entries().map(p => structuredClone(p)));
  },
  /**
   * Clears icon map.
   */
  clear(): void {
    iconMap.clear();
  },
};

// icon map
const iconMap = new Map<string, { black: any; white: any }>();

// Initial registers
IconMap.registerMap(new Map([
  [EIcon("bullet"), { black: bullet_black, white: bullet_white }],

  // arrow
  [EIcon("checked"), { black: checked_black, white: checked_white }],
  [EIcon("arrowLeft"), { black: arrow_left_black, white: arrow_left_white }],
  [EIcon("arrowRight"), { black: arrow_right_black, white: arrow_right_white }],
  [EIcon("arrowUp"), { black: arrow_up_black, white: arrow_up_white }],
  [EIcon("arrowDown"), { black: arrow_down_black, white: arrow_down_white }],

  // full arrow
  [EIcon("fullArrowLeft"), { black: fullarrow_left_black, white: fullarrow_left_white }],
  [EIcon("fullArrowRight"), { black: fullarrow_right_black, white: fullarrow_right_white }],
  [EIcon("fullArrowUp"), { black: fullarrow_up_black, white: fullarrow_up_white }],
  [EIcon("fullArrowDown"), { black: fullarrow_down_black, white: fullarrow_down_white }],

  [EIcon("search"), { black: search_black, white: search_white }],
  [EIcon("clear"), { black: clear_black, white: clear_white }],
  [EIcon("games"), { black: games_black, white: games_white }],
  [EIcon("internetExplorer"), { black: ie_black, white: ie_white }],
  [EIcon("video"), { black: video_black, white: video_white }],
  [EIcon("store"), { black: store_black, white: store_white }],
  [EIcon("settings"), { black: settings_black, white: settings_white }],
  [EIcon("mail"), { black: mail_black, white: mail_white }],
  [EIcon("user"), { black: user_black, white: user_white }],
  [EIcon("security"), { black: security_black, white: security_white }],
  [EIcon("calculator"), { black: calc_black, white: calc_white }],
  [EIcon("camera"), { black: camera_black, white: camera_white }],
  [EIcon("bluetooth"), { black: bluetooth_black, white: bluetooth_white }],
  [EIcon("news"), { black: news_black, white: news_white }],
  [EIcon("bing"), { black: bing_black, white: bing_white }],
  [EIcon("opera"), { black: opera_black, white: opera_white }],
  [EIcon("chrome"), { black: chrome_black, white: chrome_white }],
  [EIcon("firefox"), { black: firefox_black, white: firefox_white }],
  [EIcon("msedge"), { black: msedge_black, white: msedge_white }],
  [EIcon("lapis"), { black: lapis_black, white: lapis_white }],
  [EIcon("idea"), { black: idea_black, white: idea_white }],
  [EIcon("help"), { black: help_black, white: help_white }],
  [EIcon("helpCircle"), { black: help_circle_black, white: help_circle_white }],
  [EIcon("new"), { black: new_black, white: new_white }],
  [EIcon("trash"), { black: trash_black, white: trash_white }],
  [EIcon("hamburguerMenu"), { black: hamburguer_menu_black, white: hamburguer_menu_white }],

  // shutdown / power
  [EIcon("shutdown"), { black: shutdown_black, white: shutdown_white }],
  [EIcon("power"), { black: shutdown_black, white: shutdown_white }],

  [EIcon("seen"), { black: seen_black, white: seen_white }],

  // mark as read / open envelope
  [EIcon("openEnvelope"), { black: open_envelope_black, white: open_envelope_white }],
  [EIcon("markAsRead"), { black: open_envelope_black, white: open_envelope_white }],

  // mark as unread / notification envelope
  [EIcon("notificationEnvelope"), { black: notification_envelope_black, white: notification_envelope_white }],
  [EIcon("markAsUnread"), { black: notification_envelope_black, white: notification_envelope_white }],

  [EIcon("starOutline"), { black: outline_star_black, white: outline_star_white }],
  [EIcon("starFill"), { black: filled_star_black, white: filled_star_white }],

  [EIcon("terminal"), { black: terminal_black, white: terminal_white }],
]));

const Img = styled.img<{
  $computed_size: string;
}>`
  && {
    width: ${($) => $.$computed_size};
    height: ${($) => $.$computed_size};
    vertical-align: middle;
  }
`;

/**
 * Icon component.
 */
export function Icon(params: IconParams) {
  // image ref
  const ref = React.useRef<null | HTMLImageElement>(null);

  // icon color
  const color_ref = React.useRef<string>("white");

  // icon type
  assert(!!params.dynamic || !!params.variant, "Icon type must be specified.");
  const type = React.useRef(params.dynamic ?? EIcon(params.variant!));

  // compute size
  const computed_size =
    params.size !== undefined ? REMConvert.pixels.remPlusUnit(params.size) : "100%";

  // adjust color
  React.useEffect(() => {
    const color_observer = new ColorObserver(ref.current!, (color: Color) => {
      const new_color = color.isLight() ? "white" : "black";
      if (new_color !== color_ref.current) {
        color_ref.current = new_color;

        // update source
        const m = iconMap.get(type.current);
        assert(m !== undefined, "Icon is not defined: " + type.current);
        ref.current!.src = (m as any)[new_color];
      }
    });

    return () => {
      color_observer.cleanup();
    };
  }, []);

  // sync icon type
  React.useEffect(() => {
    type.current = params.dynamic ?? EIcon(params.variant!);

    // update source
    const m = iconMap.get(type.current);
    assert(m !== undefined, "Icon is not defined: " + type.current);
    ref.current!.src = (m as any)[color_ref.current!];

  }, [params.dynamic, params.variant]);

  const m = iconMap.get(type.current);
  assert(m !== undefined, "Icon is not defined: " + type.current);
  return (
    <Img
      ref={ref}
      src={(m as any)[color_ref.current]}
      draggable={false}
      alt={params.dynamic}
      style={params.style}
      className={["Icon", ...(params.className ?? "").split(" ").filter(c => c != "")].join(" ")}
      id={params.id}
      $computed_size={computed_size}
    ></Img>
  );
}
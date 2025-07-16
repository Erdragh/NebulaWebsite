"use client";

import styles from "./NebulaBackground.module.scss"
import {usePathname} from "next/navigation";
import {CSSProperties, useEffect, useMemo, useRef} from "react";

function cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}
function sfc32(a: number, b: number, c: number, d: number) {
    return function() {
        a |= 0; b |= 0; c |= 0; d |= 0;
        const t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

const movementAnimationDuration = 30 * 1000;

export function NebulaBackground({nebulaComplexity = 5}: Readonly<{nebulaComplexity?: number}>) {
    const path = usePathname();

    const seed = useMemo(() => cyrb128(path + nebulaComplexity), [path, nebulaComplexity]);
    const rand = useMemo(() => sfc32(...seed), [seed]);

    const randoms = [...useMemo(() => new Array(nebulaComplexity * 2 * 5 + 1).fill(0).map(() => rand()), [nebulaComplexity, rand])]

    const rotation = randoms.pop()!;

    const secondHalf = randoms.reduce<number[][]>((acc, cur) => acc.at(-1)?.length === 5 ? [...acc, [cur]] : [...acc.slice(0, acc.length - 1), [...(acc.at(-1) ?? []), cur]], [])
    const firstHalf = secondHalf.splice(secondHalf.length / 2);

    const firstRefs = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let running = true;

        const updateTiming = (time: DOMHighResTimeStamp) => {
            const all = [...firstHalf, ...secondHalf];
            const allElements = [...firstRefs.current!.children, ...secondRef.current!.children] as HTMLDivElement[];
            for (const [[x, y, timingOffset], element] of all.reduce<[[x: number, y: number, offset: number], HTMLDivElement][]>((acc, cur, i) => [...acc, [[cur[0], cur[1], cur[4]], allElements[i]] as [[number, number, number], HTMLDivElement]], [])) {
                // from 0 to 1
                const progress = ((time - timingOffset * movementAnimationDuration + movementAnimationDuration) % movementAnimationDuration) / movementAnimationDuration;

                const xProgress = (progress < 0.25 ? progress : (progress < 0.5 ? 0.5 - progress : (progress < 0.75 ? progress - 0.5 : 1 - progress))) * 4;

                element.style.setProperty("--x", "" + ((1 - xProgress) * x + xProgress * (1 - x)));
                element.style.setProperty("--y", "" + ((1 - progress) * y + progress * (1 - y)));
            }

            if (running) requestAnimationFrame(updateTiming)
        }
        updateTiming(0);

        return () => {
            running = false
        };
    })

    return <>
        <div className={styles.background} style={{"--rotation": rotation} as CSSProperties}>
            <div ref={firstRefs} className={styles.backgroundTransformRoot}>
                {firstHalf.map(([x, y, color, scale], i) => <div key={i} className={styles.thing} style={{"--x": x, "--y": y, "--hue": color, "--scale": scale} as CSSProperties}></div>)}
            </div>
            <div ref={secondRef} className={styles.backgroundTransformRoot}>
                {secondHalf.map(([x, y, color, scale], i) => <div key={i} className={styles.thing} style={{"--x": x, "--y": y, "--hue": color, "--scale": scale} as CSSProperties}></div>)}
            </div>
        </div>
        <div className={styles.filter}></div>
    </>
}
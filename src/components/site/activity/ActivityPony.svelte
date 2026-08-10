<script lang="ts">
    const animations = {
        "sit": {
            src: "/images/activity/sit.gif",
            width: 42,
        },
        "sleep": {
            src: "/images/activity/sleep.gif",
            width: 48,
        },
        "groggy": {
            src: "/images/activity/groggy.png",
            width: 44,
        },
        "eepy": {
            src: "/images/activity/eepy.gif",
            width: 44,
        },
        "dance-sit": {
            src: "/images/activity/dance-sit.gif",
            width: 43,
        },
        "dance-sit-2": {
            src: "/images/activity/dance-sit-2.gif",
            width: 44,
        },
        "dance-3": {
            src: "/images/activity/dance-3.gif",
            width: 45,
        },
        "dance-4": {
            src: "/images/activity/dance-4.gif",
            width: 54,
        },
        "dance-5": {
            src: "/images/activity/dance-5.gif",
            width: 45,
        },
        "dance-5-hype": {
            src: "/images/activity/dance-5-hype.gif",
            width: 45,
        },
        "dance-sleep": {
            src: "/images/activity/dance-sleep.gif",
            width: 49,
        },
        "finding-music": {
            src: "/images/activity/finding-music.gif",
            width: 42,
        },
        "finding-music-sleepy": {
            src: "/images/activity/finding-music-sleepy.gif",
            width: 42,
        },
        "sit-ponder": {
            src: "/images/activity/sit-ponder.gif",
            width: 42,
        },
        "sit-think": {
            src: "/images/activity/sit-think.gif",
            width: 42,
        },
        "tippy-taps": {
            src: "/images/activity/tippy-taps.gif",
            width: 44,
        },
        "making-music": {
            src: "/images/activity/making-music.gif",
            width: 44,
        },
    } as const;

    const sitStateSrcs = [
        "/images/activity/sit-stare-cr.png",
        "/images/activity/sit-stare-br.png",
        "/images/activity/sit-stare-bc.png",
        "/images/activity/sit-stare-bl.png",
        "/images/activity/sit-stare-cl.png",
        "/images/activity/sit-stare-tl.png",
        "/images/activity/sit-stare-tc.png",
        "/images/activity/sit-stare-tr.png",
    ];

    let { animation }: { animation: keyof typeof animations } = $props();

    let ponyEl: HTMLElement | undefined = $state();
    let ponyLookAtSrc: string | undefined = $state();
    let pointerNoticed = $state(false);

    let ponySrc: string = $derived.by(() => {
        if (animation === "sit" && ponyLookAtSrc) {
            return ponyLookAtSrc;
        }

        return animations[animation]?.src;
    });

    let ponyPixelWidth: number = $derived(animations[animation].width);

    function onPointerMove(event: PointerEvent) {
        if (!ponyEl) return;
        if (event.pointerType !== "mouse") return;

        let ponyRect = ponyEl.getBoundingClientRect();

        let eyeX = ponyRect.left + ponyRect.width * 0.33;
        let eyeY = ponyRect.top + ponyRect.height * 0.4;

        let offsetX = event.clientX - eyeX;
        let offsetY = event.clientY - eyeY;

        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

        if (distance < ponyRect.width * 0.7) {
            pointerNoticed = true;
        }
        if (distance > ponyRect.width * 4) {
            pointerNoticed = false;
        }

        if (pointerNoticed) {
            if (distance < ponyRect.width * 0.07) {
                ponyLookAtSrc = "/images/activity/sit-stare-cc.png";
                return;
            }

            let angle = Math.atan2(offsetY, offsetX) * (180 / Math.PI);
            if (angle < 0) {
                angle = 360 + angle;
            }

            angle = Math.floor((angle + 22.5) / 45) % 8;
            ponyLookAtSrc = sitStateSrcs[angle];
        } else {
            ponyLookAtSrc = undefined;
        }
    }
</script>

<svelte:document onpointermove={(event) => onPointerMove(event)} />

<div class="pony-container" style:--pony-pixel-width={ponyPixelWidth}>
    <div class="pony-inner">
        <img class="pony-image" src={ponySrc} alt="" bind:this={ponyEl} />
    </div>
</div>

<style lang="scss">
    .pony-container {
        --pony-pixel-max-width: 48;
        --pony-pixel-max-height: 60;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        container-type: inline-size;
        aspect-ratio: var(--pony-pixel-max-width) / var(--pony-pixel-max-height);

        .pony-inner {
            width: fit-content;
        }
    }

    .pony-image {
        width: calc(var(--pony-pixel-width) / var(--pony-pixel-max-width) * 100cqw);
        image-rendering: pixelated;
    }
</style>

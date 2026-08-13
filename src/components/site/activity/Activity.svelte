<script lang="ts">
    import { onMount, type ComponentProps } from "svelte";
    import ActivityPony from "./ActivityPony.svelte";

    let activities: any = $state(null);
    let updateTime: number = $state(0);

    let activity = $derived.by(() => {
        if (activities === null || activities === undefined) return null;
        return activities[0] ?? null;
    });

    let musicProgress = $derived.by(() => {
        if (!activity) return null;
        if (activity.type !== "music") return null;
        if (!activity.player?.currentTime || !activity.player?.duration) return null;
        if (updateTime <= 0) return null; // Trigger Svelte to re-run every update

        let duration: number = activity.player.duration;
        let current: number = Math.min(
            Math.max(
                Date.now() - activity.player.currentTime.timestamp + activity.player.currentTime.position,
                0,
            ),
            activity.player.duration,
        );

        return {
            current,
            duration,
            progress: current / duration,
        };
    });

    const idleLines = {
        awake: [
            "Chilling",
            "Being a goober",
            "Enjoying life",
            "Living their best life",
            "Away from keyboard",
            "Doing something fun",
            "Enjoying peace and quiet",
        ],
        asleep: [
            "Sleeping peacefully",
            "Having a snooze",
            "Getting some rest",
            "Snuggled in bed",
            "Having nice dreams",
            "Catching Zzz's",
        ],
        morning: ["Waking up", "Crawling out of bed", "Fighting bed gravity"],
        evening: ["Feeling a little sleepy", "All tuckered out", "Ready for bed", "Feeling pretty tired"],
    };

    let wakeSate: "awake" | "asleep" | "morning" | "evening" = $derived.by(() => {
        let hour = new Date().getUTCHours();

        if (hour >= 0 && hour < 2) {
            return "evening";
        }
        if (hour >= 2 && hour < 11) {
            return "asleep";
        }
        if (hour >= 11 && hour < 13) {
            return "morning";
        }

        return "awake";
    });

    let activityName = $derived.by(() => {
        if (!activity) {
            return fallbackName;
        }

        if (activity.metadata?.["site.activity.title"]) {
            return activity.metadata?.["site.activity.title"];
        }

        if (activity.type === "music") {
            return "Listening to music";
        }
        if (activity.type === "radio") {
            return "Listening to the radio";
        }
        if (activity.type === "finding-music") {
            return "Choosing a song";
        }
        if (activity.type === "finding-music") {
            return "Choosing a song";
        }
        if (activity.type === "game") {
            if (activity.game?.name) {
                return `Playing ${activity.game?.name}`;
            }
            return "Playing a game";
        }
        if (activity.type === "software") {
            if (activity.software?.name) {
                return `Using ${activity.software?.name}`;
            }
            return "At their computer";
        }
        if (activity.type === "programming") {
            return "Programming";
        }
        if (activity.type === "art") {
            return "Making art";
        }
        if (activity.type === "music-production") {
            return "Making music";
        }

        console.warn(`Unknown activity type ${activity.type}`);
        return "Up to mischief";
    });

    let fallbackName = $derived.by(() => {
        let lines = idleLines[wakeSate] ?? ["Away from keyboard"];
        return lines[Math.floor(Math.random() * lines.length)];
    });

    let animation: ComponentProps<typeof ActivityPony>["animation"] = $derived.by(() => {
        if (!activity) {
            if (wakeSate === "asleep") {
                return "sleep";
            }
            if (wakeSate === "morning") {
                return "groggy";
            }
            if (wakeSate === "evening") {
                return "eepy";
            }
            return "sit";
        }

        if (activity.metadata?.["site.activity.pony-animation"]) {
            return activity.metadata["site.activity.pony-animation"];
        }

        if (activity.type === "music" || activity.type === "radio") {
            if (activity.metadata?.["music.high-volume"] === true) {
                let move = Math.floor(updateTime / 10000) % 2;

                switch (move) {
                    case 0:
                        return "dance-5-hype";
                    case 1:
                        return "dance-3";
                }
            }

            if (wakeSate === "asleep") {
                return "dance-sleep";
            }

            return "dance-sit";
        }

        if (activity.type === "finding-music") {
            if (wakeSate === "asleep") {
                return "finding-music-sleepy";
            }

            return "finding-music";
        }

        if (activity.type === "game") {
            return "sit";
        }

        if (activity.type === "software" || activity.type === "programming" || activity.type === "art") {
            let move = Math.floor(updateTime / 10000) % 2;

            switch (move) {
                case 0:
                    return "sit-ponder";
                case 1:
                    return "sit-think";
            }
        }

        if (activity.type === "music-production") {
            return "making-music";
        }

        return "sit";
    });

    let activeSince = $derived.by(() => {
        if (!activity || !activity.activeSince) return null;
        if (updateTime <= 0) return null; // Trigger Svelte to re-run every update

        let ms = Math.max(0, updateTime - activity.activeSince);

        let secs = Math.floor(ms / 1000);
        let mins = Math.floor(secs / 60);
        let hours = Math.floor(mins / 60);
        let days = Math.floor(hours / 24);

        if (mins < 1) {
            return `${secs}s`;
        }
        if (hours < 1) {
            return `${mins % 60}m ${(secs % 60).toString().padStart(2, "0")}s`;
        }
        if (days < 1) {
            return `${hours}hr ${(mins % 60).toString().padStart(2, "0")}m`;
        }
        if (days < 7) {
            return `${days}d ${(hours % 24).toString().padStart(2, "0")}hr`;
        }
        return "For an eternity";
    });

    let favouriteHeartPulseRate = $derived.by(() => {
        if (!activity?.metadata?.["site.activity.heart-bpm"]) return 0.6;
        return 1 / (activity.metadata["site.activity.heart-bpm"] / 60);
    });

    onMount(() => {
        let eventSource = new EventSource("https://api.paperbark.horse/activity/current/live");

        eventSource.addEventListener("message", (event) => {
            let data = JSON.parse(event.data);

            if (data.event === "activity-update") {
                console.log(`Live activity updated`);
                console.log(data);
                activities = data.activities;
            }
        });

        eventSource.addEventListener("error", (event) => {
            console.error(`Live activity error`);
        });

        let updateInterval = setInterval(() => {
            updateTime = Date.now();
        }, 100);

        return () => {
            clearInterval(updateInterval);
            eventSource.close();
        };
    });
</script>

<div class="activity">
    <div class="details">
        <div class="detail-header">
            <h2 class="title">Paperbark is currently...</h2>
            <span class="activity-name">{activityName}</span>
        </div>
        {#if activity}
            {#if activity.type === "music" && activity.track}
                <div class="music-playback">
                    <div class="cover-image">
                        <img
                            src={activity.track?.cover ?? "/images/default-cover-art.png"}
                            alt=""
                            class="cover-image"
                        />
                        {#if activity.metadata?.["music.favourite"] === true}
                            <div
                                class="favourite-heart"
                                style:--heart-pulse-rate={`${favouriteHeartPulseRate}s`}
                            >
                                <div class="shadow">
                                    <img src="/assets/icons/favourite-heart-shadow.svg" alt="" />
                                </div>
                                <div class="foreground">
                                    <img src="/assets/icons/favourite-heart.svg" alt="" />
                                </div>
                            </div>
                        {/if}
                    </div>
                    <div class="music-info">
                        <div class="music-details">
                            {#if activity.track?.title}
                                <span class="music-title" title={activity.track.title}>
                                    {activity.track.title}
                                </span>
                            {/if}
                            {#if activity.track?.artist}
                                <span class="music-artist" title={activity.track.artist}>
                                    {activity.track.artist}
                                </span>
                            {/if}
                            {#if activity.track?.album && activity.track?.album !== activity.track?.title && activity.track?.album !== activity.track?.artist}
                                {#if activity.track.albumArtist && activity.track.albumArtist !== activity.track.artist && activity.track.albumArtist !== activity.track.album}
                                    <span
                                        class="music-album"
                                        title={`${activity.track.albumArtist} - ${activity.track.album}`}
                                    >
                                        {activity.track.albumArtist} - {activity.track.album}
                                    </span>
                                {:else}
                                    <span class="music-album" title={activity.track.album}>
                                        {activity.track.album}
                                    </span>
                                {/if}
                            {/if}
                        </div>
                        {#if musicProgress}
                            <div class="music-progress" style:--progress={musicProgress.progress}>
                                <div class="music-progress-bar"></div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
            {#if activity.type === "radio" && activity.radio}
                <div class="music-playback">
                    <div class="cover-image">
                        <img
                            src={activity.track?.cover ??
                                activity.radio?.cover ??
                                "/images/default-cover-art.png"}
                            alt=""
                            class="cover-image"
                        />
                    </div>
                    <div class="music-info">
                        <div class="music-details">
                            {#if activity.track?.title}
                                <span class="music-title" title={activity.track.title}>
                                    {activity.track.title}
                                </span>
                            {/if}
                            {#if activity.track?.artist}
                                <span class="music-artist" title={activity.track.artist}>
                                    {activity.track.artist}
                                </span>
                            {/if}
                            {#if activity.radio?.name}
                                <span class="music-album" title={activity.radio?.name}>
                                    {#if activity.radio?.url}
                                        <a
                                            href={activity.radio.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {activity.radio?.name}
                                        </a>
                                    {:else}
                                        {activity.radio?.name}
                                    {/if}
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
            {#if (activity.type === "software" || activity.type === "programming" || activity.type === "art" || activity.type === "music-production") && activity.software}
                <div class="software-info">
                    {#if activity.software.cover}
                        <img src={activity.software.cover} alt="" class="software-cover" />
                    {:else}
                        <img src="/images/default-software-cover.png" alt="" class="software-cover" />
                    {/if}
                    <div class="software-details">
                        <span class="software-name">
                            {#if activity.software?.url}
                                <a href={activity.software.url} target="_blank" rel="noopener noreferrer">
                                    {activity.software.name}
                                </a>
                            {:else}
                                {activity.software.name}
                            {/if}
                        </span>
                        {#if activeSince}
                            <span class="active-since">{activeSince}</span>
                        {/if}
                    </div>
                </div>
            {/if}
            {#if activity.type === "game" && activity.game}
                <div class="game-info">
                    {#if activity.game.cover}
                        <img src={activity.game.cover} alt="" class="game-cover" />
                    {:else}
                        <img src="/images/default-game-cover.png" alt="" class="game-cover" />
                    {/if}
                    <div class="game-details">
                        <span class="game-name">
                            {#if activity.game?.url}
                                <a href={activity.game.url} target="_blank" rel="noopener noreferrer">
                                    {activity.game.name}
                                </a>
                            {:else}
                                {activity.game.name}
                            {/if}
                        </span>
                        {#if activeSince}
                            <span class="active-since">{activeSince}</span>
                        {/if}
                    </div>
                </div>
            {/if}
        {:else}
            <div class="offline-info">
                I'm offline right now. Check back later when I'm doing something more interesting!
            </div>
        {/if}
    </div>
    <div class="activity-pony">
        <ActivityPony {animation} />
    </div>
</div>

<style lang="scss">
    .activity {
        display: grid;
        grid-template-columns: 1fr 10rem;
        grid-template-areas: "details pony";

        gap: 1rem;
    }

    a[href] {
        &:focus-visible,
        &:hover {
            text-decoration: underline;
        }
    }

    .details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        grid-area: details;
        min-width: 0;

        gap: 1rem;

        line-height: 1.15;

        .detail-header {
            display: flex;
            flex-direction: column;

            gap: 0.2rem;
        }

        .title {
            font-weight: var(--font-medium);
        }

        .activity-name {
            font-size: 1.75rem;
            font-weight: var(--font-semibold);
        }
    }

    .activity-pony {
        width: 100%;
    }

    .offline-info {
        line-height: 1.25;
    }

    .music-playback {
        display: flex;
        flex-direction: row;
        align-items: center;

        gap: 0.75rem;

        .music-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex-grow: 1;

            gap: 0.5rem;

            line-height: 1.075;

            overflow: hidden;

            .music-details {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }

            .music-title {
                font-weight: var(--font-bold);
            }

            .music-title,
            .music-artist,
            .music-album {
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.25;
                overflow: hidden;
            }
        }

        .cover-image {
            position: relative;

            > img {
                width: 5rem;
                aspect-ratio: 1 / 1;

                border-radius: 0.25rem;

                object-fit: cover;
            }
        }

        .music-progress {
            height: 0.4rem;

            border-radius: 100rem;

            background-color: hsl(213, 50%, 90%);

            overflow: hidden;

            .music-progress-bar {
                width: calc(var(--progress, 0) * 100%);
                height: 100%;

                background-color: hsl(213, 83%, 57%);
            }
        }
    }

    .software-info {
        display: flex;
        flex-direction: row;
        align-items: center;

        gap: 0.75rem;

        .software-cover {
            width: 3.5rem;
        }

        .software-details {
            display: flex;
            flex-direction: column;
        }

        .software-name {
            font-weight: var(--font-bold);
        }
    }

    .game-info {
        display: flex;
        flex-direction: row;
        align-items: center;

        gap: 0.75rem;

        .game-cover {
            width: 3.5rem;
            border-radius: 0.25rem;
        }

        .game-details {
            display: flex;
            flex-direction: column;
        }

        .game-name {
            font-weight: var(--font-bold);
        }
    }

    .activity-pony {
        grid-area: pony;
    }

    .favourite-heart {
        position: absolute;
        bottom: 0.4rem;
        right: 0.35rem;

        transform: rotate(5deg);

        .foreground,
        .shadow {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 1.7rem;
            aspect-ratio: 1 / 1;

            font-size: 2.5rem;
            line-height: 0.7;

            user-select: none;
            pointer-events: none;

            animation-duration: var(--heart-pulse-rate, 0.6s);
            animation-iteration-count: infinite;
        }

        .shadow {
            animation-name: favourite-heart-shadow;
        }

        .foreground {
            filter: drop-shadow(0.12rem 0.12rem 0.2rem rgb(0, 0, 0, 20%));
            animation-name: favourite-heart-pulse;
        }

        img {
            width: 100%;
            height: 100%;
        }
    }

    @container (width < 550px) {
        .activity {
            grid-template-columns: 1fr;
            grid-template-areas:
                "details"
                "pony";

            padding-top: 1rem;
        }

        .details {
            gap: 1rem;
        }

        .activity-pony {
            max-width: min(10rem, 60cqw);
            justify-self: center;
        }
    }

    @keyframes favourite-heart-pulse {
        0% {
            transform: translate(50%, 50%) scale(1);
        }
        10% {
            transform: translate(50%, 50%) scale(1.1);
        }
        100% {
            transform: translate(50%, 50%) scale(1);
        }
    }

    @keyframes favourite-heart-shadow {
        0% {
            opacity: 1;
            transform: translate(50%, 50%) scale(1.1);
        }
        100% {
            opacity: 0;
            transform: translate(50%, 50%) scale(2.2);
        }
    }
</style>

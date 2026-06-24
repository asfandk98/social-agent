// app/api/post/route.js

const BUFFER_API_URL = "https://api.buffer.com";

async function bufferQuery(apiKey, query) {
  const res = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();
  let json;

  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse Buffer response: ${text}`);
  }

  return json;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      captions,
      imageUrl,
      platforms = [],
      scheduleTime, // ISO 8601 string, optional
    } = body;

    const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

    if (!BUFFER_API_KEY) {
      return Response.json(
        { error: "BUFFER_API_KEY not set in .env.local" },
        { status: 500 }
      );
    }

    console.log("================================");
    console.log("START BUFFER POST");
    console.log("================================");

    // ==================================================
    // GET ACCOUNT + ORGANIZATION ID
    // ==================================================

    const accountData = await bufferQuery(
      BUFFER_API_KEY,
      `
      query {
        account {
          id
          email
          organizations {
            id
            name
          }
        }
      }
      `
    );

    console.log("Account Response:");
    console.log(JSON.stringify(accountData, null, 2));

    const organizationId =
      accountData?.data?.account?.organizations?.[0]?.id;

    if (!organizationId) {
      return Response.json(
        {
          error: "Could not resolve organizationId from Buffer account",
          raw: accountData,
        },
        { status: 500 }
      );
    }

    // ==================================================
    // GET CHANNELS (formerly "profiles")
    // ==================================================

    const channelsData = await bufferQuery(
      BUFFER_API_KEY,
      `
      query {
        channels(input: { organizationId: "${organizationId}" }) {
          id
          name
          service
          avatar
        }
      }
      `
    );

    console.log("Channels Response:");
    console.log(JSON.stringify(channelsData, null, 2));

    const channels = channelsData?.data?.channels;

    if (!Array.isArray(channels)) {
      return Response.json(
        {
          error: "Could not fetch Buffer channels",
          raw: channelsData,
        },
        { status: 500 }
      );
    }

    // ==================================================
    // PLATFORM MAP (Buffer "service" values)
    // ==================================================

    const serviceMap = {
      facebook: ["facebook", "facebookpage"],
      instagram: ["instagram", "instagrambusiness"],
      twitter: ["twitter"],
      tiktok: ["tiktok"],
    };

    const results = [];

    // ==================================================
    // LOOP PLATFORMS
    // ==================================================

    for (const platform of platforms) {
      console.log(`\n\n========== PLATFORM: ${platform} ==========\n`);

      const caption = captions?.[platform];

      if (!caption) {
        results.push({
          platform,
          status: "skipped",
          reason: "No caption found",
        });
        continue;
      }

      const matchedChannels = channels.filter((c) =>
        (serviceMap[platform] || [platform]).includes(c.service)
      );

      console.log("Matched Channels:");
      console.log(JSON.stringify(matchedChannels, null, 2));

      if (matchedChannels.length === 0) {
        results.push({
          platform,
          status: "skipped",
          reason: `No ${platform} channel connected`,
        });
        continue;
      }

      // ==================================================
      // POST TO EACH CHANNEL (one mutation per channel)
      // ==================================================

      for (const channel of matchedChannels) {
        console.log("\n================================");
        console.log("Posting to channel:");
        console.log(channel);
        console.log("================================");

        // Build the createPost input
        const assetsBlock = imageUrl
          ? `assets: [ { image: { url: "${imageUrl}" } } ]`
          : "";

        const schedulingBlock = scheduleTime
          ? `schedulingType: custom\n            dueAt: "${scheduleTime}"\n            mode: addToQueue`
          : `schedulingType: automatic\n            mode: addToQueue`;

        // Escape double quotes/newlines in caption for safe embedding
        const safeCaption = caption
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n");

        // Facebook requires an explicit post type in metadata
        const metadataBlock =
          channel.service === "facebook"
            ? `metadata: { facebook: { type: post } }`
            : "";

        const mutation = `
          mutation {
            createPost(input: {
              text: "${safeCaption}"
              channelId: "${channel.id}"
              ${schedulingBlock}
              ${assetsBlock}
              ${metadataBlock}
            }) {
              ... on PostActionSuccess {
                post {
                  id
                  text
                  status
                }
              }
              ... on MutationError {
                message
              }
            }
          }
        `;

        console.log("MUTATION:");
        console.log(mutation);

        let postData;

        try {
          postData = await bufferQuery(BUFFER_API_KEY, mutation);
        } catch (err) {
          console.error("Buffer mutation request failed:", err);
          results.push({
            platform,
            channelName: channel.name,
            status: "failed",
            error: err.message,
          });
          continue;
        }

        console.log("PARSED RESPONSE:");
        console.log(JSON.stringify(postData, null, 2));

        const createPostResult = postData?.data?.createPost;

        if (createPostResult?.post) {
          results.push({
            platform,
            channelName: channel.name,
            status: "queued",
            updateId: createPostResult.post.id,
            postId: createPostResult.post.id,
            post: createPostResult.post,
          });
        } else {
          results.push({
            platform,
            channelName: channel.name,
            status: "failed",
            error:
              createPostResult?.message ||
              postData?.errors?.[0]?.message ||
              "Unknown Buffer error",
            response: postData,
          });
        }
      }
    }

    console.log("\n================================");
    console.log("FINAL RESULTS");
    console.log(JSON.stringify(results, null, 2));
    console.log("================================");

    return Response.json({
      success: true,
      results,
      debug: {
        channelsCount: channels.length,
        organizationId,
      },
    });
  } catch (err) {
    console.error("BUFFER POST ERROR");
    console.error(err);

    return Response.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

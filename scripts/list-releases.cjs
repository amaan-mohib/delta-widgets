const token = process.env.GITHUB_TOKEN;
const imageKitToken = process.env.IMAGEKIT_API_KEY;
const imageKitEndpoint = process.env.IMAGEKIT_ENDPOINT;

if (!token || !imageKitToken || !imageKitEndpoint) {
  throw new Error("No github token or ImageKit token found");
}

async function fetchReleases() {
  const res = await fetch(
    `https://api.github.com/repos/amaan-mohib/delta-widgets/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  );
  return await res.json();
}

async function fetchLatestRelease() {
  const res = await fetch(
    `https://api.github.com/repos/amaan-mohib/delta-widgets/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  );
  const { tag_name, name } = await res.json();
  return { tag_name, name };
}

async function upload(payload) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  formData.append("fileName", "delta-widgets-releases.json");
  formData.append("folder", "delta-widgets");
  formData.append("useUniqueFileName", false);

  await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Basic " + imageKitToken,
    },
    body: formData,
  });
}

async function purgeCache() {
  await fetch("https://api.imagekit.io/v1/files/purge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + imageKitToken,
    },
    body: JSON.stringify({
      url: imageKitEndpoint + "/delta-widgets-releases.json",
    }),
  });
}

async function main() {
  const [list, latest] = await Promise.all([
    fetchReleases(),
    fetchLatestRelease(),
  ]);

  const releases = {};
  list.forEach((item) => {
    const {
      id,
      html_url,
      tag_name,
      name,
      draft,
      prerelease,
      published_at,
      assets,
      body,
      discussion_url,
    } = item;
    if (draft || prerelease) {
      return;
    }
    const cleanAssets = (assets || []).map((i) => {
      const { id, browser_download_url, name, size, created_at, updated_at } =
        i;
      return {
        id,
        url: browser_download_url,
        name,
        size,
        created_at,
        updated_at,
      };
    });
    const release = {
      id,
      url: html_url,
      tag_name,
      name,
      published_at,
      assets: cleanAssets,
      discussion_url,
      body,
    };
    releases[tag_name || name] = release;
  });

  const finalJson = {
    releases,
    latest,
  };

  try {
    await upload(finalJson);
    await purgeCache();
  } catch (error) {
    console.error(error);
  }
}

main();

// Import the CSV data directly into Supabase
async function importCSVData() {
  try {
    console.log("📊 Starting CSV data import...")

    // Fetch the CSV data
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/spaces_rows-69dvLkV0GFH1rxAtHlsXsQiKJUyaCU.csv",
    )
    const csvText = await response.text()

    console.log("📄 CSV data fetched successfully")
    console.log("📏 CSV length:", csvText.length)

    // Parse CSV manually
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    console.log("📋 Headers:", headers)
    console.log("📊 Total rows:", lines.length - 1)

    // Parse each row
    const spaces = []
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
      if (!row.trim()) continue

      // Split by comma but handle quoted values
      const values = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < row.length; j++) {
        const char = row[j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value

      // Create space object
      const space = {}
      headers.forEach((header, index) => {
        let value = values[index] || ""
        value = value.replace(/^"/, "").replace(/"$/, "") // Remove quotes
        space[header] = value
      })

      // Transform to match our database schema
      const transformedSpace = {
        host_id: "csv-import-host", // We'll need a default host
        title: space.title || "Parking Space",
        location: space.location || "",
        features: space.features || "",
        is_available: space.is_available === "true" || space.is_available === true,
        description: space.description || "",
        price_per_day: Number.parseFloat(space.price_per_day) || 0,
        available_from: space.available_from || "2024-01-01",
        available_to: space.available_to || "2024-12-31",
        image_url: space.image_url || null,
        address: space.address || space.location || "",
        postcode: space.postcode || "",
        latitude: Number.parseFloat(space.latitude) || null,
        longitude: Number.parseFloat(space.longitude) || null,
        what3words: space.what3words || null,
        available_days: space.available_days || "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: space.available_hours || "00:00-23:59",
      }

      spaces.push(transformedSpace)
    }

    console.log(`✅ Parsed ${spaces.length} spaces`)

    // Show sample data
    console.log("\n🔍 Sample spaces:")
    spaces.slice(0, 3).forEach((space, index) => {
      console.log(`${index + 1}. ${space.title}`)
      console.log(`   Location: ${space.location}`)
      console.log(`   Postcode: ${space.postcode}`)
      console.log(`   Price: £${space.price_per_day}/day`)
      console.log(`   Available: ${space.is_available}`)
      console.log("")
    })

    // Count SE17 spaces
    const se17Spaces = spaces.filter(
      (space) =>
        space.postcode?.includes("SE17") || space.location?.includes("SE17") || space.address?.includes("SE17"),
    )

    console.log(`🎯 SE17 spaces found: ${se17Spaces.length}`)

    if (se17Spaces.length > 0) {
      console.log("\n📍 SE17 Spaces:")
      se17Spaces.forEach((space, index) => {
        console.log(`${index + 1}. ${space.title} (${space.postcode}) - £${space.price_per_day}/day`)
      })
    }

    console.log("\n✅ CSV parsing completed successfully!")
    console.log("📝 Next steps:")
    console.log("1. Create a default host user in the users table")
    console.log("2. Insert these spaces into the Supabase spaces table")
    console.log("3. Test the search functionality")

    return {
      success: true,
      totalSpaces: spaces.length,
      se17Spaces: se17Spaces.length,
      sampleSpaces: spaces.slice(0, 3),
      allSpaces: spaces,
    }
  } catch (error) {
    console.error("❌ Error importing CSV:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Run the import
importCSVData().then((result) => {
  console.log("\n🏁 Import completed:", result.success ? "SUCCESS" : "FAILED")
})

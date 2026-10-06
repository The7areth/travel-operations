function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value)
}

function money(value, currency = 'USD') {
  return `${escapeHtml(currency || 'USD')} ${Number(value || 0).toLocaleString()}`
}

function paragraph(value) {
  return escapeHtml(value).replace(/\n/g, '<br>')
}

function slug(value) {
  return String(value || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function imagePosition(item = {}) {
  const x = Number.isFinite(Number(item.imagePositionX)) ? Number(item.imagePositionX) : 50
  const y = Number.isFinite(Number(item.imagePositionY)) ? Number(item.imagePositionY) : 50
  return `${x}% ${y}%`
}

function imageHtml(src, fallbackHeight, item = {}, alt = '') {
  return src
    ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" style="width:100%;height:${fallbackHeight}px;object-fit:cover;object-position:${imagePosition(item)};display:block;" />`
    : `<div style="width:100%;height:${fallbackHeight}px;background:#f5edd6;"></div>`
}

function findCurrentActivity(dayActivity, daysDestination) {
  const activities = daysDestination?.activities ?? []
  return activities.find(activity =>
    activity._id?.toString?.() === dayActivity.activityId ||
    activity.id?.toString?.() === dayActivity.activityId
  )
}

function currentActivityData(activity, dayDestinations) {
  const destination = (dayDestinations ?? []).find(dest =>
    dest?._id?.toString?.() === activity.destination?.toString?.() ||
    dest?._id?.toString?.() === activity.destination?._id?.toString?.()
  )
  const current = findCurrentActivity(activity, destination)
  return {
    ...activity,
    activityName: current?.name || activity.activityName,
    description: current?.description ?? activity.description,
    duration: current?.duration ?? activity.duration,
    image: current?.image ?? activity.image,
    imagePositionX: current?.imagePositionX ?? activity.imagePositionX,
    imagePositionY: current?.imagePositionY ?? activity.imagePositionY,
  }
}

function buildOfferHtml(offer, exportInfo = {}) {
  const company = offer.company?.name ?? 'Valued Client'
  const people = offer.people ?? []
  const days = offer.days ?? []
  const options = offer.options ?? []
  const coverNames = people.map(p => p.name).join(' & ')
  const activityCount = days.reduce((sum, day) => sum + (day.activities?.length ?? 0), 0)

  const uniqueDestinations = days
    .flatMap(d => d.destinations ?? [])
    .filter((d, i, a) => d && a.findIndex(x => x._id?.toString() === d._id?.toString()) === i)

  const daysHtml = days.map((day, i) => {
    const dest = day.destinations?.[0]
    const imgHtml = imageHtml(dest?.coverImage, 260, dest, dest?.name)
    const activitiesHtml = (day.activities ?? []).map(rawActivity => {
      const activity = currentActivityData(rawActivity, day.destinations)
      return `
      <div style="display:flex;gap:18px;padding:16px 0;border-top:1px solid #eee8dc;page-break-inside:avoid;">
        ${activity.image ? `<div style="width:108px;height:76px;overflow:hidden;flex-shrink:0;">${imageHtml(activity.image, 76, activity, activity.activityName)}</div>` : '<div style="width:8px;height:8px;border-radius:50%;background:#b8963e;margin-top:8px;flex-shrink:0;"></div>'}
        <div style="flex:1;">
          <p style="font-size:15px;color:#111;margin:0 0 4px;font-family:Georgia,serif;">${escapeHtml(activity.activityName)}</p>
          ${activity.description ? `<p style="font-size:12px;line-height:1.6;color:#777;margin:0 0 8px;font-family:Georgia,serif;">${paragraph(activity.description)}</p>` : ''}
          <p style="font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#b8963e;margin:0;font-family:sans-serif;">${escapeHtml(activity.optionLabel || 'Option')} / ${money(activity.price, activity.currency)}</p>
        </div>
      </div>`
    }).join('')

    return `
      <div style="margin-bottom:0;page-break-inside:avoid;">
        ${imgHtml}
        <div style="padding:40px 48px;">
          <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8963e;margin:0 0 8px;font-family:sans-serif;">Day ${i + 1}</p>
          <h2 style="font-size:32px;font-weight:300;margin:0 0 20px;color:#111;font-family:Georgia,serif;">${escapeHtml(dest?.name ?? 'En Route')}</h2>
          ${dest?.description ? `<p style="font-size:13px;line-height:1.8;color:#777;margin:0 0 18px;font-family:Georgia,serif;">${paragraph(dest.description)}</p>` : ''}
          <p style="font-size:14px;line-height:1.9;color:#555;margin:0;font-family:Georgia,serif;">${paragraph(day.notes || '')}</p>
          ${activitiesHtml ? `<div style="margin-top:28px;"><p style="font-size:10px;color:#b8963e;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-family:sans-serif;">Selected Experiences</p>${activitiesHtml}</div>` : ''}
          ${dest?.properties?.highlights ? `<div style="margin-top:24px;padding:20px 24px;background:#faf9f7;border-left:3px solid #b8963e;"><p style="font-size:10px;color:#b8963e;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-family:sans-serif;">Highlights</p><p style="font-size:13px;color:#666;margin:0;line-height:1.7;font-family:Georgia,serif;">${paragraph(dest.properties.highlights)}</p></div>` : ''}
        </div>
        <div style="height:1px;background:#f0ece4;margin:0 48px;"></div>
      </div>`
  }).join('')

  const optionsHtml = options.map((opt, i) => `
    <div style="page-break-before:always;padding:80px 48px;min-height:297mm;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;">
      <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8963e;margin:0 0 16px;font-family:sans-serif;">Option ${i + 1} of ${options.length}</p>
      <h2 style="font-size:44px;font-weight:200;margin:0 0 32px;color:#111;font-family:Georgia,serif;">${escapeHtml(opt.label)}</h2>
      <p style="font-size:15px;line-height:1.9;color:#555;max-width:580px;margin:0 0 48px;font-family:Georgia,serif;">${paragraph(opt.description)}</p>
      <div style="border-top:1px solid #e8e0d0;padding-top:40px;">
        <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#aaa;margin:0 0 12px;font-family:sans-serif;">Total Investment</p>
        <p style="font-size:56px;font-weight:200;color:#111;margin:0;font-family:Georgia,serif;">${money(opt.price, 'USD')} <span style="font-size:18px;color:#aaa;font-family:sans-serif;font-weight:400;">PER PERSON</span></p>
        <p style="font-size:12px;color:#bbb;margin-top:12px;font-family:sans-serif;letter-spacing:0.5px;">Subject to availability</p>
      </div>
    </div>`
  ).join('')

  const firstDest = days[0]?.destinations?.[0]
  const versionLine = exportInfo.sequence
    ? `Reference ${escapeHtml(exportInfo.label)} / ${escapeHtml(new Date(exportInfo.exportedAt).toLocaleDateString('en-GB'))}`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; color: #111; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>

<div style="width:210mm;min-height:297mm;display:flex;flex-direction:column;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;right:0;height:66%;overflow:hidden;">
    ${firstDest?.coverImage
      ? `<img src="${escapeAttr(firstDest.coverImage)}" style="width:100%;height:100%;object-fit:cover;object-position:${imagePosition(firstDest)};display:block;" />`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#f5edd6,#e8dcc8);"></div>`}
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.05) 50%,rgba(255,255,255,1) 100%);"></div>
  </div>
  <div style="position:relative;z-index:1;margin-top:auto;padding:48px;padding-top:calc(66% + 0px);">
    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#b8963e;margin-bottom:16px;font-family:sans-serif;">Prepared exclusively for</p>
    <h1 style="font-size:52px;font-weight:200;color:#111;margin-bottom:10px;line-height:1.05;font-family:Georgia,serif;">${escapeHtml(company)}</h1>
    <p style="font-size:18px;font-weight:300;color:#777;margin-bottom:20px;font-family:Georgia,serif;">${escapeHtml(coverNames)}</p>
    ${versionLine ? `<p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:28px;font-family:sans-serif;">${versionLine}</p>` : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:40px;">
      ${uniqueDestinations.map(d =>
        `<span style="border:1px solid rgba(184,150,62,0.4);color:#b8963e;padding:7px 18px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-family:sans-serif;">${escapeHtml(d.name)}${d.country ? ', ' + escapeHtml(d.country) : ''}</span>`
      ).join('')}
    </div>
    <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#ccc;font-family:sans-serif;">${days.length} Day${days.length !== 1 ? 's' : ''} / ${activityCount} Experience${activityCount !== 1 ? 's' : ''} / ${options.length} Option${options.length !== 1 ? 's' : ''}</p>
  </div>
</div>

<div style="page-break-before:always;">
${daysHtml}
</div>

${optionsHtml}

<div style="page-break-before:always;padding:80px 48px;">
  <p style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8963e;margin-bottom:32px;font-family:sans-serif;">Terms & Notes</p>
  <p style="font-size:14px;line-height:2;color:#666;font-family:Georgia,serif;max-width:560px;">All prices are per person unless stated otherwise, inclusive only of items listed in the selected itinerary and options. International flights are excluded unless stated. Rates are subject to availability and may change without notice. This offer is valid for 14 days from the date of issue. For reservations and queries, please contact your dedicated travel consultant.</p>
</div>

</body>
</html>`
}

function buildRoomingListHtml(list, version, exportInfo = {}) {
  const guests = (version.guests ?? []).filter(guest => guest.fullName)
  const guestRows = guests.map((guest, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(guest.fullName)}</td>
      <td>${escapeHtml(guest.gender)}</td>
      <td>${escapeHtml(guest.roomNumber)}</td>
      <td>${guest.roomOccupancy === 'DBL' ? 'X' : ''}</td>
      <td>${guest.roomOccupancy === 'Twin' ? 'X' : ''}</td>
      <td>${guest.roomOccupancy === 'SGL' ? 'X' : ''}</td>
      <td>${escapeHtml(guest.roomType)}</td>
      <td>${escapeHtml(guest.checkIn)}</td>
      <td>${escapeHtml(guest.checkOut)}</td>
      <td>${escapeHtml(guest.nights)}</td>
      <td>${[
        guest.preExtension ? 'Pre-Extension' : '',
        guest.postExtension ? 'Post-Extension' : '',
        guest.roomingNotes || '',
      ].filter(Boolean).map(escapeHtml).join('<br>')}</td>
      <td>${escapeHtml(guest.arrivalTime)}</td>
      <td>${[guest.email, guest.phone].filter(Boolean).map(escapeHtml).join('<br>')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #111; font-size: 10px; }
  h1 { font-size: 20px; font-weight: 400; margin: 0 0 4px; }
  .meta { color: #777; margin-bottom: 16px; }
  .summary { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .summary td { border: 1px solid #ddd; padding: 7px 8px; vertical-align: top; }
  .summary td:first-child { width: 160px; color: #777; font-weight: 700; text-transform: uppercase; font-size: 9px; }
  .rooming { width: 100%; border-collapse: collapse; }
  .rooming th { background: #f5edd6; color: #6d5520; text-transform: uppercase; font-size: 8px; letter-spacing: .5px; }
  .rooming th, .rooming td { border: 1px solid #ddd; padding: 5px; vertical-align: top; }
  .rooming td:nth-child(2) { min-width: 150px; }
</style>
</head>
<body>
  <h1>${escapeHtml(list.company?.name ?? 'Company')} / ${escapeHtml(list.name)}</h1>
  <div class="meta">${escapeHtml(version.label)} (${escapeHtml(version.status)}) / ${escapeHtml(exportInfo.label || '')} / ${escapeHtml(new Date(exportInfo.exportedAt || Date.now()).toLocaleDateString('en-GB'))}</div>
  <table class="summary">
    <tr><td>Group Name/reference</td><td>${escapeHtml(version.groupReference)}</td><td>${escapeHtml(version.ratesNotes)}</td></tr>
    <tr><td>Hotel</td><td>${escapeHtml(version.hotelName)}</td><td>Double: ${escapeHtml(version.doubleRate)}</td></tr>
    <tr><td>Total number of rooms</td><td>${escapeHtml(version.roomSummary || version.totalRooms)}</td><td>Twin: ${escapeHtml(version.twinRate)}</td></tr>
    <tr><td>Total number of guests</td><td>${escapeHtml(version.totalGuests || guests.length)}</td><td>Single: ${escapeHtml(version.singleRate)}</td></tr>
    <tr><td>Meals Plan</td><td colspan="2">${escapeHtml(version.mealPlan || version.mealBasis || 'B&B')}</td></tr>
    <tr><td>Payment</td><td colspan="2">${escapeHtml(version.payment)}</td></tr>
    <tr><td>Extra</td><td colspan="2">${escapeHtml(version.extra)}</td></tr>
  </table>
  <table class="rooming">
    <thead>
      <tr>
        <th>#</th><th>Full Name</th><th>M/F</th><th>Rm#</th><th>DBL</th><th>Twin</th><th>SGL</th><th>Room Category</th><th>Check-In</th><th>Check-Out</th><th>Nights</th><th>Comments/Special Requests</th><th>Expected Arrival</th><th>Email / Phone</th>
      </tr>
    </thead>
    <tbody>${guestRows}</tbody>
  </table>
  ${version.notes ? `<p style="margin-top:14px;color:#666;">${paragraph(version.notes)}</p>` : ''}
</body>
</html>`
}

function buildServiceConfirmationHtml(item, version, exportInfo = {}) {
  const days = version.days ?? []
  const daySections = days.map(day => `
    <section class="day">
      <h2>${escapeHtml(day.title)}</h2>
      <table class="services">
        <thead>
          <tr><th>Type of services</th><th>Description</th><th>Services Status</th></tr>
        </thead>
        <tbody>
          ${(day.rows ?? []).map(row => `
            <tr>
              <td>${paragraph(row.type)}</td>
              <td>${paragraph(row.description)}</td>
              <td>${escapeHtml(row.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, sans-serif; color: #111; font-size: 10px; }
  h1 { font-size: 22px; font-weight: 500; margin: 0 0 10px; }
  h2 { background: #d9ead3; border: 1px solid #a8c79c; font-size: 11px; padding: 7px 8px; margin: 14px 0 0; }
  .meta { color: #666; margin-bottom: 10px; }
  .summary, .services { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .summary td { border: 1px solid #b7b7b7; padding: 6px 7px; vertical-align: top; }
  .summary td:first-child { width: 29%; background: #f3f3f3; font-weight: 700; }
  .services th { background: #e2f0d9; color: #111; border: 1px solid #8eb47f; padding: 6px; text-align: left; }
  .services th:nth-child(1), .services td:nth-child(1) { width: 30%; }
  .services th:nth-child(3), .services td:nth-child(3) { width: 16%; }
  .services td { border: 1px solid #b7b7b7; padding: 6px; vertical-align: top; line-height: 1.35; }
  .day { page-break-inside: avoid; }
</style>
</head>
<body>
  <h1>Services Confirmation</h1>
  <div class="meta">${escapeHtml(item.name)} / ${escapeHtml(item.groupReference)} / ${escapeHtml(version.label)} / ${escapeHtml(exportInfo.label || '')}</div>
  <table class="summary">
    <tr><td>Guests</td><td>${paragraph(version.guests)}</td></tr>
    <tr><td>Total Travelers</td><td>${escapeHtml(version.totalTravelers)}</td></tr>
    <tr><td>Rooms</td><td>${escapeHtml(version.rooms)}</td></tr>
    <tr><td>Travelers Contact Information</td><td>${paragraph(version.travelersContact || 'N/A')}</td></tr>
    <tr><td>Client</td><td>${escapeHtml(version.client || item.company?.name || '')}</td></tr>
    <tr><td>Traveller's Destination</td><td>${escapeHtml(version.destination)}</td></tr>
    <tr><td>Emergency Contact</td><td>${escapeHtml(version.emergencyContact)}</td></tr>
    <tr><td>Dietary restrictions/Medical Conditions/requests</td><td>${paragraph(version.dietaryNotes)}</td></tr>
  </table>
  <h2>List of services</h2>
  ${daySections}
</body>
</html>`
}

module.exports = {
  buildHtml: buildOfferHtml,
  buildOfferHtml,
  buildRoomingListHtml,
  buildServiceConfirmationHtml,
  slug,
}

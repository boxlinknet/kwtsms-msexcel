# kwtSMS for Excel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Office Add-in](https://img.shields.io/badge/Office-Excel%20Add--in-217346?logo=microsoftexcel&logoColor=white)](https://learn.microsoft.com/en-us/office/dev/add-ins/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![kwtSMS](https://img.shields.io/badge/SMS%20Gateway-kwtSMS-FFA200)](https://www.kwtsms.com)
[![Platform](https://img.shields.io/badge/Platform-Excel%20Web%20%7C%20Windows%20%7C%20Mac-blue)](https://appsource.microsoft.com/)

Send bulk SMS directly from your Excel spreadsheets using the [kwtSMS](https://www.kwtsms.com) SMS gateway.

## About kwtSMS

[kwtSMS](https://www.kwtsms.com) is a Kuwait-based SMS gateway providing reliable messaging to 80+ countries. It supports bulk campaigns, transactional notifications, and OTP verification. kwtSMS is used by businesses across the GCC and MENA region.

## Features

- **Bulk SMS from spreadsheets** - Map phone number and message columns, send to all rows
- **80+ country validation** - Exact phone number length and format checking per country
- **Message cleaning** - Strips emojis, hidden Unicode characters, and HTML before sending
- **Delivery logging** - Every send logged to a dedicated `kwtsms_logs` worksheet
- **Column mapping** - Pick which columns contain phone numbers and messages
- **Test mode** - Safely test your SMS workflow without delivering messages
- **Country coverage check** - Skips numbers outside your account's coverage area
- **Duplicate removal** - Automatic deduplication before sending

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [kwtSMS](https://www.kwtsms.com) account with API credentials

### Install

```bash
git clone https://github.com/boxlinknet/kwtsms-msexcel.git
cd kwtsms-msexcel
npm install
```

### Development

```bash
npm run dev-server
```

### Sideload in Excel

1. Open [Excel on the web](https://www.office.com/launch/excel)
2. Go to **Insert** > **Add-ins** > **Upload My Add-in**
3. Select `manifest.xml` from the project root
4. The kwtSMS task pane opens in the sidebar

### Build

```bash
npm run build          # Production build
npm run validate       # Validate manifest
npm run lint           # Lint check
```

### Test

```bash
npm test                                                    # Unit tests only
KWTSMS_USERNAME=xxx KWTSMS_PASSWORD=xxx npm test            # Include API tests
```

## How It Works

1. **Login** - Enter your kwtSMS username and password. The add-in verifies your credentials and loads your account settings.
2. **Map columns** - Select which spreadsheet column contains phone numbers, and optionally which contains messages.
3. **Preview** - See how many valid numbers were found, duplicates removed, and numbers skipped.
4. **Send** - Messages are sent automatically in batches. Results are logged to a dedicated worksheet.

## Project Structure

```
src/
  taskpane/
    taskpane.html          Task pane UI (login + send interface)
    taskpane.ts            UI controller
    taskpane.css           kwtSMS branded styles
  services/
    kwtsms-api.ts          API client (balance, senderid, coverage, send, validate)
    phone-utils.ts         Phone normalization, validation (83 countries), dedup
    message-utils.ts       Message cleaning (emoji, HTML, hidden chars)
    settings.ts            Office document settings wrapper
    logger.ts              Excel sheet logger
  models/
    types.ts               TypeScript interfaces
  localization/
    strings.ts             UI strings (English, Arabic-ready)
  commands/
    commands.ts            Ribbon button handler
```

## Supported Platforms

| Platform | Status |
|----------|--------|
| Excel on the web | Supported |
| Excel on Windows (Microsoft 365) | Supported |
| Excel 2016+ on Windows | Supported |
| Excel on Mac (Microsoft 365) | Supported |
| Excel 2016+ on Mac | Supported |
| Excel on iPad | Supported |

## Roadmap

- [x] v1.0 - Excel task pane, bulk SMS, column mapping, logging
- [ ] v1.1 - Custom Excel functions (`=KWTSMS.SEND()`, `=KWTSMS.BALANCE()`)
- [ ] v1.2 - Arabic UI localization
- [ ] v2.0 - Outlook add-in

## License

[MIT](LICENSE)

## Support

- Website: [kwtsms.com](https://www.kwtsms.com)

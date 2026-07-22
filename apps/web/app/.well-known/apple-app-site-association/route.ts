import { NextResponse } from 'next/server';

const APPLE_TEAM_ID = 'Y6FSFUALV7';
const IOS_BUNDLE_ID = 'com.portalcarmelitano.app';

const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`,
        paths: ['*'],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(appleAppSiteAssociation, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

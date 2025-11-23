export default {
  name: 'annoyancyRemovalSettings',
  fields: [
    {
      type: 'string',
      name: 'key',
      unique: true,
    },
    {
      type: 'boolean',
      name: 'hideLicenseSettings',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'hideAiIntegration',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'hideMobileDeprecated',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'hideChangePassword',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'hideVerification',
      defaultValue: true,
    },
    {
      type: 'boolean',
      name: 'hideTheme',
      defaultValue: true,
    },
  ],
};

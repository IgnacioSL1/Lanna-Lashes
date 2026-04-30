/**
 * HubSpot CRM service
 * Syncs users and events to HubSpot automatically
 */
import { Client } from '@hubspot/api-client';

const client = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

export const hubspot = {
  /**
   * Called on user signup — creates a contact in HubSpot CRM
   */
  async createContact(user: { id: string; email: string; firstName: string; lastName: string }) {
    try {
      const contact = await client.crm.contacts.basicApi.create({
        properties: {
          email:      user.email,
          firstname:  user.firstName,
          lastname:   user.lastName,
          lanna_user_id: user.id,
          hs_lead_status: 'NEW',
          lifecycle_stage: 'lead',
        },
      });
      return contact.id;
    } catch (err: any) {
      // Contact might already exist — try to find and return it
      if (err.code === 409) {
        const existing = await client.crm.contacts.searchApi.doSearch({
          filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: user.email }] }],
          properties: ['email'],
          limit: 1,
          after: 0,
          sorts: [],
        });
        return existing.results[0]?.id ?? null;
      }
      throw err;
    }
  },

  /**
   * Track a custom event (course_purchased, course_completed, etc.)
   * Triggers HubSpot workflow automations
   */
  async trackEvent(
    user: { email: string; hubspotContactId?: string | null },
    eventName: string,
    properties: Record<string, any> = {}
  ) {
    // Use HubSpot timeline events API
    await client.crm.timeline.eventsApi.create({
      eventTemplateId: process.env[`HUBSPOT_EVENT_${eventName.toUpperCase()}`] ?? '',
      email: user.email,
      extraData: properties,
      tokens: {},
    });
  },
};

export default hubspot;

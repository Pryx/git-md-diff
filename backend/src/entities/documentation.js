import sql from '../db';
import Role from './role';

const defaults = {
  id: -1,
  provider: '',
  providerId: -1,
  name: '',
  description: '',
  slug: ''
};

export default class Documentation {
  constructor(params) {
    this.id = params.id || defaults.id;
    this.provider = params.provider || defaults.provider;
    this.providerId = params.providerId || params.providerid || defaults.providerId;
    this.name = params.name || defaults.name;
    this.slug = params.slug || defaults.slug;
    this.description = params.description || defaults.description;
  }

  static async get(id) {
    let [docu] = await sql`SELECT * FROM documentations WHERE id=${id}`;
    return new Documentation(docu);
  }

  static async getByProviderId(provider, id) {
    const results = await sql`SELECT * FROM documentations WHERE provider=${provider} AND providerId=${id}`;

    if (results.count) {
      const [docu] = results;
      return new Documentation(docu);
    }

    return null;
  }

  static async getUserDocumentations(userId) {
    const results = await sql`SELECT * FROM documentations WHERE id IN (SELECT docuId FROM roles WHERE userId=${userId})`;

    if (results.count) {
      let docus = await Promise.all(
        results.map(async docu => {
          const d = new Documentation(docu)
          d.accessLevel = await d.getAccessLevel(userId);
          return d;
        }));
      return docus;
    }

    return [];
  }

  
  async getAccessLevel(userId){
    const role = await Role.get(userId, this.id);
    return role.level;
  }


  static async remove(docuId) {
    return sql`DELETE FROM documentations WHERE id=${userId} CASCADE`;
  }

  async save() {
    return sql`INSERT INTO documentations (provider, providerId, name, slug, description) 
      VALUES (${this.provider}, ${this.providerId}, ${this.name}, ${this.slug}, ${this.description})  
      ON CONFLICT (provider, providerId) DO UPDATE SET name=${this.name}, slug=${this.slug}, description=${this.description};`
  }
}
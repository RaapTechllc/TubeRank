/**
 * Profile repository for profiles operations
 */
export class ProfileRepository {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Get all profiles with their sources
   * @returns Array of profiles
   */
  async findAll() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*, profile_sources(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get profile by ID
   * @param id - Profile ID
   * @returns Profile or null
   */
  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*, profile_sources(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create a new profile
   * @param profile - Profile data
   * @returns Created profile
   */
  async create(profile: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update a profile
   * @param id - Profile ID
   * @param updates - Fields to update
   * @returns Updated profile
   */
  async update(id: string, updates: Record<string, unknown>) {
    const { updated_at, created_at, ...updateData } = updates as any

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a profile
   * @param id - Profile ID
   * @returns Success boolean
   */
  async delete(id: string) {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Get active profiles
   * @returns Array of active profiles
   */
  async findActive() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*, profile_sources(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

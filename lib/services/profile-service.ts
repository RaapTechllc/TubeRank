/**
 * Profile service for business logic
 */
import { ProfileRepository } from '@/lib/repositories'
import type { ProfileWithSources } from '@/types'

export class ProfileService {
  private profileRepo: ProfileRepository

  constructor(supabase: any) {
    this.profileRepo = new ProfileRepository(supabase)
  }

  /**
   * Get all profiles
   * @returns Array of profiles with sources
   */
  async getAllProfiles(): Promise<ProfileWithSources[]> {
    return this.profileRepo.findAll()
  }

  /**
   * Get profile by ID
   * @param id - Profile ID
   * @returns Profile with sources
   */
  async getProfileById(id: string): Promise<ProfileWithSources> {
    const profile = await this.profileRepo.findById(id)
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`)
    }
    return profile
  }

  /**
   * Create a new profile
   * @param profileData - Profile data to create
   * @returns Created profile
   */
  async createProfile(profileData: Record<string, unknown>): Promise<ProfileWithSources> {
    return this.profileRepo.create(profileData)
  }

  /**
   * Update a profile
   * @param id - Profile ID
   * @param updates - Fields to update
   * @returns Updated profile
   */
  async updateProfile(id: string, updates: Record<string, unknown>): Promise<ProfileWithSources> {
    return this.profileRepo.update(id, updates)
  }

  /**
   * Delete a profile
   * @param id - Profile ID
   * @returns Success boolean
   */
  async deleteProfile(id: string): Promise<boolean> {
    return this.profileRepo.delete(id)
  }

  /**
   * Activate a profile
   * @param id - Profile ID
   * @returns Updated profile
   */
  async activateProfile(id: string): Promise<ProfileWithSources> {
    return this.profileRepo.update(id, { is_active: true })
  }

  /**
   * Deactivate a profile
   * @param id - Profile ID
   * @returns Updated profile
   */
  async deactivateProfile(id: string): Promise<ProfileWithSources> {
    return this.profileRepo.update(id, { is_active: false })
  }

  /**
   * Get active profiles
   * @returns Array of active profiles
   */
  async getActiveProfiles(): Promise<ProfileWithSources[]> {
    return this.profileRepo.findActive()
  }
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Crown,
  Shield,
  Eye,
  UserMinus,
  Mail,
  X,
  Save,
  Settings,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import GlowOrb from "@/components/GlowOrb";

// ─── Types ──────────────────────────────────────────────────────────────────────

type Role = "owner" | "admin" | "member" | "viewer";

interface TeamMember {
  id?: number;
  user_id?: string;
  email: string;
  name?: string;
  role: Role;
  joined_at?: string;
}

interface Team {
  id?: number;
  name: string;
  slug: string;
  role?: Role;
  members: TeamMember[];
  created_at?: string;
}

const ROLE_CONFIG: Record<Role, { icon: typeof Crown; color: string; label: string }> = {
  owner: { icon: Crown, color: "#F59E0B", label: "Owner" },
  admin: { icon: Shield, color: "#6BA9FF", label: "Admin" },
  member: { icon: Users, color: "#2CE8C3", label: "Member" },
  viewer: { icon: Eye, color: "#A2BDDB", label: "Viewer" },
};

const ROLE_ORDER: Role[] = ["owner", "admin", "member", "viewer"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function getInitials(email: string, name?: string): string {
  const src = name || email;
  const parts = src.split(/[\s.@_]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2)).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = ["#2CE8C3", "#6BA9FF", "#F59E0B", "#EF4444", "#A78BFA", "#F472B6", "#34D399", "#FB923C"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // Form states
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamSlug, setNewTeamSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await fetchApi("/api/teams");
      setTeams((data || []) as Team[]);
    } catch {
      // demo data
      setTeams([
        {
          id: 1,
          name: "Engineering",
          slug: "engineering",
          role: "owner",
          created_at: new Date().toISOString(),
          members: [
            { id: 1, email: "alice@example.com", name: "Alice Chen", role: "owner", joined_at: new Date().toISOString() },
            { id: 2, email: "bob@example.com", name: "Bob Smith", role: "admin", joined_at: new Date().toISOString() },
            { id: 3, email: "carol@example.com", name: "Carol Wu", role: "member", joined_at: new Date().toISOString() },
          ],
        },
        {
          id: 2,
          name: "Platform",
          slug: "platform",
          role: "admin",
          created_at: new Date().toISOString(),
          members: [
            { id: 4, email: "dave@example.com", name: "Dave Park", role: "owner", joined_at: new Date().toISOString() },
            { id: 5, email: "alice@example.com", name: "Alice Chen", role: "admin", joined_at: new Date().toISOString() },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    setSaving(true);
    try {
      await fetchApi("/api/teams", {
        method: "POST",
        body: JSON.stringify({ name: newTeamName, slug: newTeamSlug || newTeamName.toLowerCase().replace(/\s+/g, "-") }),
      });
      toast.success(`Team "${newTeamName}" created`);
      setCreateModalOpen(false);
      setNewTeamName("");
      setNewTeamSlug("");
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!selectedTeam?.id) return;
    setSaving(true);
    try {
      await fetchApi(`/api/teams/${selectedTeam.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.email} from the team?`)) return;
    if (!selectedTeam?.id) return;
    try {
      await fetchApi(`/api/teams/${selectedTeam.id}/members/${member.id}`, {
        method: "DELETE",
      });
      toast.success(`${member.email} removed`);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleChangeRole = async (member: TeamMember, newRole: Role) => {
    if (!selectedTeam?.id) return;
    setRoleDropdownOpen(null);
    try {
      await fetchApi(`/api/teams/${selectedTeam.id}/members/${member.id}`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`${member.email} is now ${newRole}`);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change role");
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedTeam?.id) return;
    setSaving(true);
    try {
      await fetchApi(`/api/teams/${selectedTeam.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName, slug: editSlug }),
      });
      toast.success("Team settings updated");
      setSettingsModalOpen(false);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const openSettings = () => {
    if (!selectedTeam) return;
    setEditName(selectedTeam.name);
    setEditSlug(selectedTeam.slug);
    setSettingsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-[3px] border-[#2CE8C3]/20 border-t-[#2CE8C3] rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-[#A2BDDB]/40">
          Loading teams...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative overflow-hidden">
      <GlowOrb color="#F59E0B" size={400} x="10%" y="15%" delay={1} opacity={0.03} />
      <GlowOrb color="#6BA9FF" size={350} x="85%" y="25%" delay={3} opacity={0.03} />

      <motion.div variants={container} initial="hidden" animate="show">
        {/* ═══ Header ═══ */}
        <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/[0.08] border border-[#F59E0B]/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
              >
                Teams
              </h1>
              <p className="text-[#A2BDDB]/40 text-sm">
                Manage your teams and collaborate with your organization
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            New Team
          </motion.button>
        </motion.div>

        {/* ═══ Team Cards or Team Detail ═══ */}
        {!selectedTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team, idx) => (
              <motion.div
                key={team.id || idx}
                variants={item}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedTeam(team)}
                className="glass-card glass-card-hover rounded-2xl p-6 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-white font-bold"
                    style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                  >
                    {team.name}
                  </h3>
                  {team.role && (
                    <RoleBadge role={team.role} />
                  )}
                </div>

                <div className="text-[10px] text-[#A2BDDB]/20 font-mono mb-4">
                  @{team.slug}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {(team.members || []).slice(0, 4).map((member, mIdx) => (
                      <div
                        key={mIdx}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#080C10]"
                        style={{
                          backgroundColor: getAvatarColor(member.email),
                          color: "#000",
                        }}
                        title={member.email}
                      >
                        {getInitials(member.email, member.name)}
                      </div>
                    ))}
                    {(team.members || []).length > 4 && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#080C10] bg-white/[0.06] text-[#A2BDDB]/50">
                        +{(team.members || []).length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#A2BDDB]/25 font-medium">
                    {(team.members || []).length} member{(team.members || []).length !== 1 ? "s" : ""}
                  </span>
                </div>
              </motion.div>
            ))}

            {teams.length === 0 && (
              <motion.div variants={item} className="col-span-full glass-card rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/[0.06] border border-[#F59E0B]/15 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <h2
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  No teams yet
                </h2>
                <p className="text-[#A2BDDB]/40 text-sm max-w-md mx-auto mb-6">
                  Create a team to start collaborating with your organization members.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#2CE8C3] text-black text-sm font-bold hover:bg-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Team
                </motion.button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            key={selectedTeam.id}
          >
            {/* Back + Header */}
            <motion.div variants={item} className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-[#A2BDDB]/40 hover:text-white text-sm transition-colors"
              >
                &larr; Back to teams
              </button>
            </motion.div>

            <motion.div variants={item} className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                  >
                    {selectedTeam.name}
                  </h2>
                  <div className="text-[10px] text-[#A2BDDB]/20 font-mono mt-1">
                    @{selectedTeam.slug} &middot; {(selectedTeam.members || []).length} member{(selectedTeam.members || []).length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openSettings}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#A2BDDB]/60 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors min-h-[44px]"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInviteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors min-h-[44px]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Members list */}
            <motion.div variants={item} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/[0.04]">
                <h3
                  className="text-white text-lg font-bold"
                  style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
                >
                  Members
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {(selectedTeam?.members || []).map((member, idx) => {
                  const roleCfg = ROLE_CONFIG[member.role];
                  const RoleIcon = roleCfg.icon;
                  const canManage = selectedTeam.role === "owner" || selectedTeam.role === "admin";
                  const isSelf = member.role === "owner";

                  return (
                    <div
                      key={member.id || idx}
                      className="flex items-center gap-4 p-3 sm:p-4 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: getAvatarColor(member.email),
                          color: "#000",
                        }}
                      >
                        {getInitials(member.email, member.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {member.name || member.email}
                        </div>
                        <div className="text-[10px] text-[#A2BDDB]/25 font-mono truncate">
                          {member.email}
                        </div>
                      </div>

                      {/* Role badge + actions */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {canManage && !isSelf ? (
                          <div className="relative">
                            <button
                              onClick={() => setRoleDropdownOpen(roleDropdownOpen === member.email ? null : member.email)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors min-h-[44px]"
                              style={{
                                borderColor: `${roleCfg.color}30`,
                                backgroundColor: `${roleCfg.color}08`,
                              }}
                            >
                              <RoleIcon className="w-3 h-3" style={{ color: roleCfg.color }} />
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: roleCfg.color }}>
                                {roleCfg.label}
                              </span>
                              <ChevronDown className="w-3 h-3 text-[#A2BDDB]/20" />
                            </button>
                            <AnimatePresence>
                              {roleDropdownOpen === member.email && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  className="absolute right-0 top-full mt-1 z-10 glass-card rounded-xl p-1.5 min-w-[140px]"
                                >
                                  {ROLE_ORDER.filter((r) => r !== "owner").map((role) => {
                                    const rc = ROLE_CONFIG[role];
                                    const RI = rc.icon;
                                    return (
                                      <button
                                        key={role}
                                        onClick={() => handleChangeRole(member, role)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/[0.04] transition-colors"
                                        style={{ color: rc.color }}
                                      >
                                        <RI className="w-3.5 h-3.5" />
                                        {rc.label}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                            style={{
                              borderColor: `${roleCfg.color}30`,
                              backgroundColor: `${roleCfg.color}08`,
                            }}
                          >
                            <RoleIcon className="w-3 h-3" style={{ color: roleCfg.color }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: roleCfg.color }}>
                              {roleCfg.label}
                            </span>
                          </div>
                        )}

                        {canManage && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="p-2.5 sm:p-2 rounded-lg hover:bg-red-500/[0.08] text-[#A2BDDB]/15 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 transition-all min-h-[44px] sm:min-h-0 flex items-center justify-center"
                            title="Remove member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══ Create Team Modal ═══ */}
      <AnimatePresence>
        {createModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setCreateModalOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                  Create Team
                </h2>
                <button onClick={() => setCreateModalOpen(false)} className="text-[#A2BDDB]/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => {
                      setNewTeamName(e.target.value);
                      if (!newTeamSlug) setNewTeamSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                    }}
                    placeholder="Engineering"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={newTeamSlug}
                    onChange={(e) => setNewTeamSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                    placeholder="engineering"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setCreateModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#A2BDDB]/50 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateTeam}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Creating..." : "Create Team"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Invite Modal ═══ */}
      <AnimatePresence>
        {inviteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setInviteModalOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                  Invite Member
                </h2>
                <button onClick={() => setInviteModalOpen(false)} className="text-[#A2BDDB]/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2BDDB]/20" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["admin", "member", "viewer"] as Role[]).map((role) => {
                      const rc = ROLE_CONFIG[role];
                      const RI = rc.icon;
                      return (
                        <button
                          key={role}
                          onClick={() => setInviteRole(role)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                            inviteRole === role
                              ? "border-white/20 bg-white/[0.04] text-white"
                              : "border-white/[0.04] text-[#A2BDDB]/30 hover:border-white/[0.08] hover:text-[#A2BDDB]/50"
                          }`}
                        >
                          <RI className="w-3.5 h-3.5" style={{ color: inviteRole === role ? rc.color : undefined }} />
                          {rc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setInviteModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#A2BDDB]/50 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInvite}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {saving ? "Sending..." : "Send Invite"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Settings Modal ═══ */}
      <AnimatePresence>
        {settingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSettingsModalOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}>
                  Team Settings
                </h2>
                <button onClick={() => setSettingsModalOpen(false)} className="text-[#A2BDDB]/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#A2BDDB]/25 uppercase tracking-wider mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white text-sm font-mono placeholder:text-[#A2BDDB]/15 focus:outline-none focus:border-[#2CE8C3]/30 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setSettingsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#A2BDDB]/50 text-xs font-semibold hover:text-white hover:border-white/[0.15] transition-colors">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2CE8C3] text-black text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: `${cfg.color}10`,
        color: cfg.color,
        border: `1px solid ${cfg.color}25`,
      }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

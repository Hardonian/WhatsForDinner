const React = require('react');
function useUser() { return { user: null, error: null }; }
function useSession() { return null; }
function useSupabaseClient() { return null; }
function useSupabase() { return { supabase: null }; }
module.exports = { useUser, useSession, useSupabaseClient, useSupabase };

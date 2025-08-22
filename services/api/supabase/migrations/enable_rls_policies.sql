-- PR-04: Enable RLS policies for user-related tables
-- This migration enables Row Level Security (RLS) and creates owner policies
-- to ensure users can only access their own data

-- Enable RLS for user_watchlist table
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy for user_watchlist: users can only access their own watchlist items
CREATE POLICY "Users can view their own watchlist items" ON user_watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" ON user_watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items" ON user_watchlist
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" ON user_watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for analysis_reports table
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for analysis_reports: users can only access their own reports
CREATE POLICY "Users can view their own analysis reports" ON analysis_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis reports" ON analysis_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis reports" ON analysis_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis reports" ON analysis_reports
    FOR DELETE USING (auth.uid() = user_id);

-- ai_reports table already has RLS enabled, but let's ensure proper policies exist
-- Drop existing policies if they exist and recreate them for consistency
DROP POLICY IF EXISTS "Users can view their own reports" ON ai_reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON ai_reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON ai_reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON ai_reports;

-- Create consistent policies for ai_reports
CREATE POLICY "Users can view their own ai reports" ON ai_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai reports" ON ai_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai reports" ON ai_reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai reports" ON ai_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for withdrawal_requests table
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for withdrawal_requests: users can only access their own requests
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawal requests" ON withdrawal_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for wallet_transactions table
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for wallet_transactions: users can only access transactions from their own wallets
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
    FOR SELECT USING (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()));

-- Enable RLS for user_wallets table
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Create policy for user_wallets: users can only access their own wallets
CREATE POLICY "Users can view their own wallets" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for subscriptions: users can only access their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for invitations: users can only access invitations they sent or received
CREATE POLICY "Users can view invitations they sent or received" ON invitations
    FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can insert invitations they send" ON invitations
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update invitations they sent or received" ON invitations
    FOR UPDATE USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Enable RLS for referral_rewards table
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for referral_rewards: users can only access rewards where they are inviter or invitee
CREATE POLICY "Users can view their own referral rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can insert their own referral rewards" ON referral_rewards
    FOR INSERT WITH CHECK (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Enable RLS for user_coupons table
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- Create policy for user_coupons: users can only access their own coupons
CREATE POLICY "Users can view their own coupons" ON user_coupons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coupons" ON user_coupons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coupons" ON user_coupons
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated and anon roles
GRANT SELECT, INSERT, UPDATE, DELETE ON user_watchlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analysis_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON withdrawal_requests TO authenticated;
GRANT SELECT, INSERT ON wallet_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invitations TO authenticated;
GRANT SELECT, INSERT ON referral_rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_coupons TO authenticated;

-- Grant read access to anon role for public data (if needed)
GRANT SELECT ON user_watchlist TO anon;
GRANT SELECT ON analysis_reports TO anon;
GRANT SELECT ON ai_reports TO anon;
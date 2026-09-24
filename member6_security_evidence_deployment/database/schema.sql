-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES & ROLES
-- ==========================================

CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    hierarchy_level INT NOT NULL
);

INSERT INTO public.roles (name, hierarchy_level, description) VALUES
('SYSTEM_ADMIN', 100, 'System Administrator'),
('SENIOR_AUTHORITY', 80, 'Senior Authority'),
('SENIOR_INVESTIGATOR', 60, 'Senior Investigator'),
('INVESTIGATOR', 40, 'Investigator'),
('ANALYST_VIEWER', 20, 'Analyst / Viewer');

CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Insert standard permissions based on matrix
INSERT INTO public.permissions (name) VALUES 
('view_cases'), ('create_cases'), ('edit_cases'), ('search_entities'), 
('view_network_graph'), ('perform_network_analysis'), ('view_timeline'), 
('view_sensitive_evidence'), ('upload_evidence'), ('verify_evidence'), 
('export_evidence'), ('generate_reports'), ('use_ai_assistant'), 
('view_gis_map'), ('manage_watchlist'), ('view_alerts'), ('manage_users'), 
('approve_role_requests'), ('assign_roles'), ('manage_permissions'), 
('view_audit_logs'), ('export_investigation_data');

-- Default role permissions mapping (Simplified for standard roles)
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    badge_number VARCHAR(50),
    active_role_id UUID REFERENCES public.roles(id),
    status VARCHAR(20) DEFAULT 'PENDING_ROLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. ROLE REQUEST FLOW
-- ==========================================

CREATE TABLE public.role_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_role_id UUID REFERENCES public.roles(id),
    status VARCHAR(20) DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, APPROVED, REJECTED
    request_reason TEXT,
    reviewer_id UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.user_custom_permissions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- ==========================================
-- 3. EVIDENCE & LEDGER (M6 FOCUS)
-- ==========================================

CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    source VARCHAR(255),
    evidence_type VARCHAR(50),
    file_path TEXT NOT NULL,
    original_sha256 VARCHAR(64) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'UNVERIFIED', -- VERIFIED, TAMPERED, UNVERIFIED
    uploaded_by UUID REFERENCES auth.users(id),
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preview_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.evidence_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id UUID REFERENCES public.evidence(id),
    action VARCHAR(50) NOT NULL, -- UPLOAD, VERIFY, ACCESS, EXPORT
    actor_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    previous_hash VARCHAR(64),
    evidence_hash VARCHAR(64) NOT NULL,
    current_record_hash VARCHAR(64) NOT NULL,
    chain_metadata JSONB DEFAULT '{}'::jsonb
);

-- Protect ledger from modifications
CREATE RULE prevent_ledger_update AS ON UPDATE TO public.evidence_ledger DO INSTEAD NOTHING;
CREATE RULE prevent_ledger_delete AS ON DELETE TO public.evidence_ledger DO INSTEAD NOTHING;

-- ==========================================
-- 4. AUDIT LOGGING
-- ==========================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    result VARCHAR(50),
    context JSONB DEFAULT '{}'::jsonb
);

CREATE RULE prevent_audit_update AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE prevent_audit_delete AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(req_permission VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    -- Check role based permissions
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.role_permissions rp ON up.active_role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE up.user_id = auth.uid() AND p.name = req_permission
    ) INTO has_perm;
    
    IF has_perm THEN
        RETURN TRUE;
    END IF;

    -- Check custom permissions
    SELECT EXISTS (
        SELECT 1 FROM public.user_custom_permissions ucp
        JOIN public.permissions p ON ucp.permission_id = p.id
        WHERE ucp.user_id = auth.uid() AND p.name = req_permission
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Evidence RLS
CREATE POLICY "View evidence if has view_cases perm"
ON public.evidence FOR SELECT
USING (user_has_permission('view_cases'));

CREATE POLICY "Insert evidence if has upload_evidence perm"
ON public.evidence FOR INSERT
WITH CHECK (user_has_permission('upload_evidence'));

CREATE POLICY "Update evidence metadata if has verify_evidence perm"
ON public.evidence FOR UPDATE
USING (user_has_permission('verify_evidence'));

-- Audit Logs RLS (Only inserts by system, reads by viewers)
CREATE POLICY "Insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "View audit logs if has view_audit_logs perm"
ON public.audit_logs FOR SELECT
USING (user_has_permission('view_audit_logs'));

-- Role Requests RLS
CREATE POLICY "Users can view their own requests"
ON public.role_requests FOR SELECT
USING (auth.uid() = user_id OR user_has_permission('approve_role_requests'));

CREATE POLICY "Users can create their own requests"
ON public.role_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authorities can update requests"
ON public.role_requests FOR UPDATE
USING (user_has_permission('approve_role_requests'));


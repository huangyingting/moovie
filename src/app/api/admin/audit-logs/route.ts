import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { listAuditLogs } from '@/lib/audit';
import { AdmissionError } from '@/lib/passwords';

export async function GET(request: Request) {
  try {
    await requireRole(['ADMIN']);
    const { searchParams } = new URL(request.url);
    const action = (searchParams.get('action') || '').trim() || undefined;
    const logs = await listAuditLogs(100, action);
    return NextResponse.json({ ok: true, items: logs });
  } catch (err) {
    if (err instanceof AdmissionError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: 'Failed to load audit logs' }, { status: 500 });
  }
}

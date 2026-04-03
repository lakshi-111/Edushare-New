import { useEffect, useState } from 'react';
import { MessageSquare, Send, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const statusConfig = {
  Pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  Answered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  Closed: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' }
};

export default function InquiriesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [receivedInquiries, setReceivedInquiries] = useState([]);
  const [sentInquiries, setSentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    try {
      // Load received inquiries (inquiries about user's uploaded resources)
      const receivedResponse = await api.get('/inquiries/received');
      setReceivedInquiries(receivedResponse.data.inquiries || []);

      // Load sent inquiries (user's own inquiries)
      const sentResponse = await api.get('/inquiries/my');
      setSentInquiries(sentResponse.data.inquiries || []);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerInquiry(inquiryId) {
    if (!answerText.trim()) return;

    try {
      await api.put(`/inquiries/${inquiryId}/answer`, { answer: answerText });
      setAnswering(null);
      setAnswerText('');
      loadInquiries(); // Refresh the list
    } catch (error) {
      console.error('Failed to answer inquiry:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          <p className="mt-2 text-sm text-slate-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ff] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Inquiries</h1>
          <p className="mt-2 text-slate-600">Manage questions and answers about your resources</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-soft">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'received'
                ? 'bg-brand-500 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Received ({receivedInquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'sent'
                ? 'bg-brand-500 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sent ({sentInquiries.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'received' ? (
            receivedInquiries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
                <MessageSquare size={48} className="mx-auto text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No inquiries received</h3>
                <p className="mt-2 text-slate-600">When users have questions about your resources, they'll appear here.</p>
              </div>
            ) : (
              receivedInquiries.map((inquiry) => {
                const StatusIcon = statusConfig[inquiry.status].icon;
                return (
                  <div key={inquiry._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{inquiry.subject}</h3>
                          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig[inquiry.status].bg} ${statusConfig[inquiry.status].color}`}>
                            <StatusIcon size={12} />
                            {inquiry.status}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          From <span className="font-medium">{inquiry.name}</span> • {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-slate-700 mb-4">{inquiry.message}</p>

                        {inquiry.status === 'Answered' && inquiry.answer && (
                          <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-900 mb-2">Your answer:</p>
                            <p className="text-slate-700">{inquiry.answer}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              Answered on {new Date(inquiry.answeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {inquiry.status === 'Pending' && (
                          <div className="mt-4">
                            {answering === inquiry._id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={answerText}
                                  onChange={(e) => setAnswerText(e.target.value)}
                                  placeholder="Write your answer..."
                                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
                                  rows={4}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAnswerInquiry(inquiry._id)}
                                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                                  >
                                    Send Answer
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAnswering(null);
                                      setAnswerText('');
                                    }}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAnswering(inquiry._id)}
                                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                              >
                                Answer Inquiry
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            sentInquiries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
                <Send size={48} className="mx-auto text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No inquiries sent</h3>
                <p className="mt-2 text-slate-600">When you send inquiries about resources, they'll appear here.</p>
              </div>
            ) : (
              sentInquiries.map((inquiry) => {
                const StatusIcon = statusConfig[inquiry.status].icon;
                return (
                  <div key={inquiry._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{inquiry.subject}</h3>
                          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusConfig[inquiry.status].bg} ${statusConfig[inquiry.status].color}`}>
                            <StatusIcon size={12} />
                            {inquiry.status}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          About "{inquiry.resourceId?.title || 'Unknown Resource'}" • {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-slate-700 mb-4">{inquiry.message}</p>

                        {inquiry.status === 'Answered' && inquiry.answer && (
                          <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-sm font-medium text-emerald-900 mb-2">Answer:</p>
                            <p className="text-emerald-800">{inquiry.answer}</p>
                            <p className="text-xs text-emerald-600 mt-2">
                              Answered on {new Date(inquiry.answeredAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
}
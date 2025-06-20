import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
// Avatar images are now served from /avatars/ directory as SVG files

export default function TutorSelection() {
  const [, setLocation] = useLocation();

  const { data: personas = [], isLoading, error } = useQuery({
    queryKey: ["/api/personas"],
    retry: 3,
    retryDelay: 1000,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token && token !== 'undefined' && token !== 'null') {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/personas', { 
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    }
  });



  const handleTutorSelect = async (personaId: string) => {
    try {
      // Create a new conversation with the selected tutor
      const token = localStorage.getItem('token');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          persona_id: personaId,
          scenario_id: null // Free chat mode
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const conversation = await response.json();
      setLocation(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      // Fallback to chat page without conversation ID
      setLocation('/chat');
    }
  };

  if (isLoading) {
    return (
      <div className="tutor-selection-loading-container">
        <div className="tutor-selection-loading-card">
          <div className="tutor-selection-loading-content">
            <div className="tutor-selection-loading-spinner"></div>
            <span className="tutor-selection-loading-text">Loading tutors...</span>
          </div>
        </div>
      </div>
    );
  }

  const getAvatarImage = (persona: any) => {
    return persona.avatar_url || '/avatars/aoi.png'; // Use database avatar URL or fallback
  };

  return (
    <div className="tutor-selection-page-container">
      {/* Header */}
      <header className="tutor-selection-header">
        <div className="tutor-selection-navigation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="tutor-selection-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="tutor-selection-page-title">
            Choose Your Tutor
          </h1>
        </div>
      </header>

      <div className="tutor-selection-content-container">
        <div className="tutor-selection-intro-section">
          <h2 className="tutor-selection-main-title">
            Who would you like to practice with?
          </h2>
          <p className="tutor-selection-main-description">
            Each tutor has a unique teaching style to match your learning
            preferences.
          </p>
        </div>



        <div className="tutor-selection-grid">
          {Array.isArray(personas) && personas.length > 0 ? (
            personas.map((persona: any) => (
              <Card
                key={persona.id}
                className="tutor-card"
                onClick={() => handleTutorSelect(persona.id)}
              >
                <CardContent className="tutor-card-content">
                  {/* Avatar */}
                  <div className="tutor-avatar-container">
                    <img
                      src={getAvatarImage(persona)}
                      alt={persona.name}
                      className="tutor-avatar-image w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  </div>

                  {/* Name & Title */}
                  <div className="tutor-info-section">
                    <h3 className="tutor-name">
                      {persona.type === "teacher"
                        ? "Aoi (葵) - Teacher"
                        : "Haruki (陽輝) - Friend"}
                    </h3>

                    <span
                      className={`tutor-type-badge ${
                        persona.type === "teacher"
                          ? "tutor-type-teacher"
                          : "tutor-type-friend"
                      }`}
                    >
                      {persona.type === "teacher"
                        ? "Formal Teacher"
                        : "Friendly Tutor"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="tutor-description">
                    {persona.description}
                  </p>

                  {/* Teaching Style */}
                  <div className="tutor-teaching-style">
                    <h4 className="tutor-teaching-style-title">
                      Teaching Style:
                    </h4>
                    <p className="tutor-teaching-style-description">
                      {persona.type === "teacher"
                        ? "Focuses on proper grammar, cultural context, and formal expressions. Perfect for building strong foundations."
                        : "Emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence."}
                    </p>
                  </div>

                  {/* Select Button */}
                  <Button
                    className="tutor-select-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTutorSelect(persona.id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Learning with{" "}
                    {persona.type === "teacher" ? "Aoi" : "Haruki"}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            // Fallback tutors when API fails or returns empty
            [
              {
                id: 1,
                name: 'Aoi',
                type: 'teacher',
                description: 'A formal Japanese teacher who focuses on proper grammar, cultural context, and structured learning. Perfect for building strong foundations in Japanese.',
                jlpt_level: 'N5',
                avatar_url: null
              },
              {
                id: 2,
                name: 'Haruki', 
                type: 'friend',
                description: 'A friendly Japanese tutor who emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence in speaking.',
                jlpt_level: 'N5',
                avatar_url: null
              }
            ].map((persona: any) => (
              <Card
                key={persona.id}
                className="tutor-card"
                onClick={() => handleTutorSelect(persona.id)}
              >
                <CardContent className="tutor-card-content">
                  {/* Avatar */}
                  <div className="tutor-avatar-container">
                    <img
                      src={getAvatarImage(persona)}
                      alt={persona.name}
                      className="tutor-avatar-image w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  </div>

                  {/* Name & Title */}
                  <div className="tutor-info-section">
                    <h3 className="tutor-name">
                      {persona.type === "teacher"
                        ? "Aoi (葵) - Teacher"
                        : "Haruki (陽輝) - Friend"}
                    </h3>
                    <span
                      className={`tutor-type-badge ${
                        persona.type === "teacher"
                          ? "tutor-type-teacher"
                          : "tutor-type-friend"
                      }`}
                    >
                      {persona.type === "teacher"
                        ? "Formal Teacher"
                        : "Friendly Tutor"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="tutor-description">
                    {persona.description}
                  </p>

                  {/* Teaching Style */}
                  <div className="tutor-teaching-style">
                    <h4 className="tutor-teaching-style-title">
                      Teaching Style:
                    </h4>
                    <p className="tutor-teaching-style-description">
                      {persona.type === "teacher"
                        ? "Focuses on proper grammar, cultural context, and formal expressions. Perfect for building strong foundations."
                        : "Emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence."}
                    </p>
                  </div>

                  {/* Select Button */}
                  <Button
                    className="tutor-select-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTutorSelect(persona.id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Learning with{" "}
                    {persona.type === "teacher" ? "Aoi" : "Haruki"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Free Chat Option */}
        <Card className="tutor-free-chat-card">
          <CardContent className="tutor-free-chat-content">
            <h3 className="tutor-free-chat-title">
              Free Chat Mode
            </h3>
            <p className="tutor-free-chat-description">
              Practice open-ended conversations without specific scenarios.
              Great for exploring topics that interest you.
            </p>
            <Button
              variant="outline"
              className="tutor-free-chat-button"
              onClick={() => setLocation("/free-chat")}
            >
              Start Free Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
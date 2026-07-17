namespace backend.Modules.UserTour.Requests;

public class CompleteTourRequest
{
    public long AgentId { get; set; }

    public string TourCode { get; set; } = string.Empty;
}
import org.json.JSONObject;
import org.json.JSONArray;
import okhttp3.*;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet("/generate-art")
public class ArtGeneratorServlet extends HttpServlet {
    private static final String API_KEY = "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"

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // Retrieve user inputs (theme, colors, tone)
        String theme = request.getParameter("theme");
        String colors = request.getParameter("colors");
        String tone = request.getParameter("tone");

        // Construct the prompt to send to the AI model
        String prompt = String.format("Generate an artistic image with the theme '%s', using colors '%s', and an emotional tone of '%s'.", theme, colors, tone);

        // Call the OpenAI API to generate the art
        OkHttpClient client = new OkHttpClient();
        MediaType mediaType = MediaType.parse("application/json");

        // Construct the body of the POST request
        String jsonBody = String.format(
            "{ \"model\": \"dall-e\", \"prompt\": \"%s\", \"n\": 1, \"size\": \"1024x1024\" }", 
            prompt
        );

        RequestBody body = RequestBody.create(mediaType, jsonBody);
        Request req = new Request.Builder()
            .url("https://api.openai.com/v1/images/generations")
            .post(body)
            .addHeader("Authorization", "Bearer " + API_KEY)
            .addHeader("Content-Type", "application/json")
            .build();

        Response res = client.newCall(req).execute();
        if (res.isSuccessful()) {
            String responseBody = res.body().string();

            try {
                // Parse the response body as a JSON object
                JSONObject jsonResponse = new JSONObject(responseBody);

                // Check if "data" key exists
                if (jsonResponse.has("data") && jsonResponse.getJSONArray("data").length() > 0) {
                    // Get the array of data (which contains the image URL)
                    JSONArray data = jsonResponse.getJSONArray("data");
                    
                    // Extract the image URL from the first element of the array
                    String imageUrl = data.getJSONObject(0).getString("url");

                    // Send the generated image URL back to the client
                    response.setContentType("application/json");
                    response.getWriter().write("{\"artUrl\": \"" + imageUrl + "\"}");
                } else {
                    // Handle case when no data is returned from OpenAI
                    response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No image data returned from API.");
                }
            } catch (Exception e) {
                // Handle JSON parsing errors or other issues
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error parsing the API response.");
            }
        } else {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate art. API call unsuccessful.");
        }
    }
}
